"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "@/lib/atriumid/session";
import { sessionIsStaff } from "@/lib/atriumid/permissions";
import {
  ForumError,
  createReply,
  createThread,
  editPost,
  reportPost,
  toggleReaction,
  type ForumUser,
} from "@/lib/forum/service";

type SessionUser = {
  id: string;
  name?: string | null;
  username?: string | null;
  role?: string | null;
  banned?: boolean | null;
  createdAt?: Date | string | null;
};

async function requireForumUser(): Promise<ForumUser> {
  const session = await getServerSession();
  const user = session?.user as SessionUser | undefined;
  if (!user) throw new Error("Sign in to participate.");
  if (user.banned) throw new Error("Your account is suspended.");
  return {
    id: user.id,
    label: user.username || user.name || "member",
    createdAt: user.createdAt,
    isStaff: sessionIsStaff(user),
  };
}

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function fail(err: unknown): { ok: false; error: string } {
  if (err instanceof ForumError) return { ok: false, error: err.message };
  if (err instanceof Error) return { ok: false, error: err.message };
  return { ok: false, error: "Something went wrong." };
}

const createThreadInput = z.object({
  categorySlug: z.string().min(1).max(80),
  title: z.string().min(4).max(160),
  body: z.string().min(2).max(20_000),
});

export async function createThreadAction(
  raw: unknown,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const user = await requireForumUser();
    const input = createThreadInput.parse(raw);
    const thread = await createThread({ ...input, user });
    revalidatePath("/forums");
    revalidatePath(`/forums/${input.categorySlug}`);
    return { ok: true, data: { slug: thread.slug } };
  } catch (err) {
    return fail(err);
  }
}

const replyInput = z.object({
  threadSlug: z.string().min(1).max(120),
  body: z.string().min(2).max(20_000),
});

export async function replyAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireForumUser();
    const input = replyInput.parse(raw);
    await createReply({ ...input, user });
    revalidatePath(`/threads/${input.threadSlug}`);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

const editInput = z.object({
  postId: z.string().min(1).max(64),
  threadSlug: z.string().min(1).max(120),
  body: z.string().min(2).max(20_000),
});

export async function editPostAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireForumUser();
    const input = editInput.parse(raw);
    await editPost({ postId: input.postId, body: input.body, user });
    revalidatePath(`/threads/${input.threadSlug}`);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

const reactInput = z.object({
  postId: z.string().min(1).max(64),
  threadSlug: z.string().min(1).max(120),
  emoji: z.string().min(1).max(8),
});

export async function reactAction(
  raw: unknown,
): Promise<ActionResult<{ added: boolean }>> {
  try {
    const user = await requireForumUser();
    const input = reactInput.parse(raw);
    const res = await toggleReaction({
      postId: input.postId,
      userId: user.id,
      emoji: input.emoji,
    });
    revalidatePath(`/threads/${input.threadSlug}`);
    return { ok: true, data: res };
  } catch (err) {
    return fail(err);
  }
}

const reportInput = z.object({
  postId: z.string().min(1).max(64),
  reason: z.string().min(3).max(500),
});

export async function reportPostAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireForumUser();
    const input = reportInput.parse(raw);
    await reportPost({
      postId: input.postId,
      reporterId: user.id,
      reason: input.reason,
    });
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}
