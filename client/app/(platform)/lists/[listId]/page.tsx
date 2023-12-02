import { Card, CardHeader, CardContent } from '@/components/ui/card';

import ListModal from '@/components/modals/list-modal';
import ListService from '@/services/list-service';
import ListTasks from '../components/list-tasks';

import { notFound } from 'next/navigation';
import { defaultEmoji } from '@/lib/constants';

interface PageProps {
    params: { listId: string }
}

async function ListPage({
    params
} : PageProps) {
  const list = await ListService.getList(params.listId);

  if (!list) return notFound();

  const title = list.emoji ? `${list.emoji} ${list.name}` : `${defaultEmoji} ${list.name}`
  
  return (
    <Card>
        <CardHeader className='pb-0'>
          <div className='flex-gap'>
            <h1 className='font-bold text-xl'>{title}</h1>
            <ListModal list={list}/>
          </div>
        </CardHeader>
        <CardContent>
          <ListTasks tasks={list.tasks}/>
        </CardContent>
    </Card>
  );
}

export default ListPage;