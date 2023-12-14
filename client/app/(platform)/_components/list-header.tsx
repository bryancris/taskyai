import React from "react";
import Link from "next/link";
import { defaultEmoji } from "@/lib/constants";

import { ListResponse } from "@/types";

const ListItem = ({
  list
} : {
  list?: ListResponse
}) => {

  if (!list) return <Link href={`/lists/braindump`} className="flex-between pb-2 block">🧠 Braindump</Link>;

  return (
    <Link key={list.id} className="flex-between pb-2 block" href={`/lists/${list.id}`}>
      <div className="truncate ...">{list.emoji ? list.emoji : defaultEmoji} {list.name}</div>
    </Link>
  )
}

export default ListItem