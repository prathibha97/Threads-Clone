'use client';
import { addCommentToThread } from '@/lib/actions/thread.action';
import { CommentValidation } from '@/lib/validations/thread';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FC } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { Input } from '../ui/input';

interface CommentProps {
  threadId: string;
  currentUserImg: string;
  currentUserId: string;
}

const Comment: FC<CommentProps> = ({
  currentUserId,
  threadId,
  currentUserImg,
}) => {
  const router = useRouter();
  const pathName = usePathname();

  const form = useForm({
    resolver: zodResolver(CommentValidation),
    defaultValues: {
      thread: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof CommentValidation>) => {
    await addCommentToThread(
      threadId,
      values.thread,
      JSON.parse(currentUserId),
      pathName
    );
    form.reset();
    router.push('/');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='comment-form'>
        <FormField
          control={form.control}
          name='thread'
          render={({ field }) => (
            <FormItem className='flex items-center gap-3 w-full'>
              <FormLabel>
                <Image
                  src={currentUserImg}
                  alt='Profile Image'
                  width={48}
                  height={48}
                  className='rounded-full object-cover'
                />
              </FormLabel>
              <FormControl className='border-none bg-transparent'>
                <Input
                  type='text'
                  placeholder='Comment...'
                  {...field}
                  className='no-focus text-light-1 outline-none'
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type='submit' className='comment-form_btn'>
          Reply
        </Button>
      </form>
    </Form>
  );
};

export default Comment;
