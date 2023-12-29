import { TaskService } from '@/services/task-service'
import { LabelService } from '@/services/label-service'
import { ListService } from '@/services/list-service'

import { format } from 'date-fns'
import { ExtendedSearchParamsOptions } from '@/lib/util/filter'

import PageWithViews from '@/components/shared/page-with-views'

interface PageProps {
  searchParams: Partial<ExtendedSearchParamsOptions>
}

export default async function Today({ searchParams }: PageProps) {
  const tasks = await TaskService.getTasks({
    ...searchParams,
    dueDate: format(new Date(), 'dd-MM-yyyy'),
    incomplete: searchParams.incomplete ?? true,
  })
  const labels = await LabelService.getLabels()
  const lists = await ListService.getLists()

  return (
    <PageWithViews
      searchParams={searchParams}
      tasks={tasks}
      labels={labels}
      lists={lists}
      heading="Inbox"
      options={{ board: { dueDate: format(new Date(), 'dd-MM-yyyy') } }}
    />
  )
}
