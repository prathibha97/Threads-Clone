'use server';
import { revalidatePath } from 'next/cache';
import Thread from '../models/thread.model';
import User from '../models/user.model';
import { connectToDB } from '../mongoose';

interface IParams {
  text: string;
  author: string;
  communityId: string | null;
  path: string;
}

export async function createThread({
  author,
  communityId,
  path,
  text,
}: IParams) {
  try {
    connectToDB();

    const createdThread = await Thread.create({
      text,
      author,
      community: null,
    });

    // update user model with the new thread
    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    });

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Error creating thread: ${error.message}`);
  }
}

export async function fetchPosts(pageNumber = 1, pageSize = 2) {
  try {
    connectToDB();

    // calculate the number of posts to skip
    const skipAmount = (pageNumber - 1) * pageSize;

    // fetch posts that have no parents (top-level threads ...)
    const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({
        path: 'author',
        model: User,
      })
      .populate({
        path: 'children', // Populate the children field
        populate: {
          path: 'author', // Populate the author field within children
          model: User,
          select: '_id name parentId image', // Select only _id and username fields of the author
        },
      });

    const totalPostsCount = await Thread.countDocuments({
      parentId: { $in: [null, undefined] },
    });

    const posts = await postsQuery.exec();

    const isNext = totalPostsCount > skipAmount + posts.length;

    return { posts, isNext };
  } catch (error) {}
}

export async function fetchThreadById(id: string) {
  connectToDB();
  try {
    // TODO: populate community
    const thread = await Thread.findById(id)
      .populate({
        path: 'author',
        model: User,
        select: '_id id name image',
      })
      .populate({
        path: 'children',
        populate: [
          {
            path: 'author',
            model: User,
            select: '_id id name parentId image',
          },
          {
            path: 'children',
            model: Thread,
            populate: {
              path: 'auhtor',
              model: User,
              select: '_id id name parentId image',
            },
          },
        ],
      })
      .exec();

    return thread;
  } catch (error: any) {
    throw new Error(`Error fetching thread ${error.message}`);
  }
}

export async function addCommentToThread(
  threadId: string,
  commentText: string,
  userId: string,
  path: string
) {

  connectToDB()

  try {
    // find original thread by its ID
    const originalThread = await Thread.findById(threadId);

    if (!originalThread) {
      throw new Error('Thread not found');
    }

    // Create a new thread with the comment text
    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId,
    });

    // save new thread
    const savedCommentThreat = await commentThread.save();

    // update the original thread to include the new comment
    originalThread.children.push(savedCommentThreat._id);

    // save the original thread
    await originalThread.save();

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Error adding comment to thread: ${error.message}`);
  }
}
