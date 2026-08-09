import { afterEach, describe, expect, it, vi } from 'vitest'
import BatchFetchAuthorActivity from '../../src/api/batch/author_activity'
import ActivityApi from '../../src/api/single/activity'
import ActivityModel from '../../src/model/activity'
import AuthorApi from '../../src/api/single/author'
import AuthorModel from '../../src/model/author'
import Logger from '../../src/library/logger'
import { LogStatus } from '../../src/shared/logging/log_contract'

describe('author activity cursor', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('advances the inclusive cursor before the next request instead of endlessly queueing tasks', async () => {
    const activityList = [
      { id: 102_000 },
      { id: 101_000 },
    ]
    const getActivityList = vi
      .spyOn(ActivityApi, 'asyncGetAutherActivityList')
      .mockResolvedValueOnce(activityList as never)
      .mockResolvedValueOnce([] as never)
    const replaceActivity = vi
      .spyOn(ActivityModel, 'asyncReplaceActivity')
      .mockResolvedValue(undefined as never)
    vi.spyOn(Logger, 'event').mockImplementation(() => undefined as never)
    vi.spyOn(Logger, 'log').mockImplementation(() => undefined)

    const batch = new BatchFetchAuthorActivity() as unknown as {
      fetchActivityInRange(urlToken: string, startAt: number, endAt: number): Promise<void>
    }
    await batch.fetchActivityInRange('fixture-author', 100, 102)

    expect(getActivityList).toHaveBeenCalledTimes(2)
    expect(getActivityList.mock.calls.map((call) => call[1])).toEqual([102, 100])
    expect(replaceActivity).toHaveBeenCalledTimes(2)
  })

  it('returns an empty success after persisting the author when the initial activity probe is empty', async () => {
    vi.spyOn(AuthorApi, 'asyncGetAutherInfo').mockResolvedValue({
      id: 'fixture-author-id',
      url_token: 'fixture-author',
      name: 'Fixture Author',
    } as never)
    const replaceAuthor = vi.spyOn(AuthorModel, 'asyncReplaceAuthor').mockResolvedValue(undefined as never)
    vi.spyOn(ActivityApi, 'asyncGetAutherLastActivityAt').mockResolvedValue(0)
    const checkActivity = vi.spyOn(ActivityApi, 'asyncCheckHasAutherActivityAfterAt')
    const getActivityList = vi.spyOn(ActivityApi, 'asyncGetAutherActivityList')
    const getTargetList = vi.spyOn(ActivityModel, 'asyncGetAllActivityTargetIdList')
    vi.spyOn(Logger, 'event').mockImplementation(() => undefined as never)
    vi.spyOn(Logger, 'log').mockImplementation(() => undefined)

    const outcome = await new BatchFetchAuthorActivity().fetch('fixture-author')

    expect(outcome).toEqual({
      status: LogStatus.SUCCESS,
      successCount: 0,
      failureCount: 0,
      failures: [],
    })
    expect(replaceAuthor).toHaveBeenCalledOnce()
    expect(checkActivity).not.toHaveBeenCalled()
    expect(getActivityList).not.toHaveBeenCalled()
    expect(getTargetList).not.toHaveBeenCalled()
  })

  it('does not start daily fetching when every monthly probe is empty', async () => {
    vi.spyOn(AuthorApi, 'asyncGetAutherInfo').mockResolvedValue({
      id: 'fixture-author-id',
      url_token: 'fixture-author',
      name: 'Fixture Author',
    } as never)
    vi.spyOn(AuthorModel, 'asyncReplaceAuthor').mockResolvedValue(undefined as never)
    vi.spyOn(ActivityApi, 'asyncGetAutherLastActivityAt')
      .mockResolvedValue(ActivityModel.ZHIHU_ACTIVITY_START_MONTH_AT)
    const checkActivity = vi.spyOn(ActivityApi, 'asyncCheckHasAutherActivityAfterAt').mockResolvedValue(false)
    const getActivityList = vi.spyOn(ActivityApi, 'asyncGetAutherActivityList')
    const getTargetList = vi.spyOn(ActivityModel, 'asyncGetAllActivityTargetIdList')
    vi.spyOn(Logger, 'event').mockImplementation(() => undefined as never)
    vi.spyOn(Logger, 'log').mockImplementation(() => undefined)

    const outcome = await new BatchFetchAuthorActivity().fetch('fixture-author')

    expect(outcome?.status).toBe(LogStatus.SUCCESS)
    expect(checkActivity).toHaveBeenCalledOnce()
    expect(getActivityList).not.toHaveBeenCalled()
    expect(getTargetList).not.toHaveBeenCalled()
  })
})
