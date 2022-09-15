import { json, type LoaderFunction, redirect } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import styled from 'styled-components'
import LinkCardList from '~/components/home/LinkCardList'
import TabLayout from '~/components/layouts/TabLayout'
import { useInfiniteScroll } from '~/hooks/useInfiniteScroll'
import { getBookmarks } from '~/lib/api/bookmark'
import { type GetBookmarksResult } from '~/lib/api/types'
import { checkIsLoggedIn } from '~/lib/protectRoute'

export const loader: LoaderFunction = async ({ request }) => {
  const isLoggedIn = await checkIsLoggedIn(request)
  if (!isLoggedIn) return redirect('/auth/login?next=/bookmarks')

  const bookmarks = await getBookmarks()
  return json(bookmarks)
}

export default function Bookmarks() {
  const initialData = useLoaderData<GetBookmarksResult>()
  const ref = useRef<HTMLDivElement>(null)

  const { data, hasNextPage, fetchNextPage } = useInfiniteQuery(
    ['bookmarks'],
    ({ pageParam }) => getBookmarks(pageParam),
    {
      initialData: {
        pageParams: [undefined],
        pages: [initialData],
      },
      getNextPageParam: (lastPage) => {
        if (!lastPage.pageInfo.hasNextPage) return undefined
        return lastPage.pageInfo.nextOffset
      },
    },
  )

  useInfiniteScroll(ref, fetchNextPage)

  const items = data?.pages.flatMap((page) => page.list.map((bookmark) => bookmark.item))

  return (
    <StyledTabLayout>
      {items ? <LinkCardList items={items} /> : null}
      <div ref={ref} />
    </StyledTabLayout>
  )
}

const StyledTabLayout = styled(TabLayout)`
  padding-top: 16px;
  padding-left: 16px;
  padding-right: 16px;
  padding-bottom: 16px;
`
