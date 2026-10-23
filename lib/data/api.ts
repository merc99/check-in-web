import * as mock from '@/lib/mock/api'
import * as remote from '@/lib/supabase/api'

/**
 * Where data comes from. `mock` (default) is the in-memory demo with the live
 * simulation; `supabase` is the real project. Set NEXT_PUBLIC_DATA_SOURCE.
 */
export const DATA_SOURCE: 'mock' | 'supabase' = process.env.NEXT_PUBLIC_DATA_SOURCE === 'supabase' ? 'supabase' : 'mock'

// Both implementations must provide exactly this surface; TypeScript checks `remote` against it.
type DataApi = Pick<
  typeof mock,
  | 'acceptJoinRequest'
  | 'addTag'
  | 'checkIn'
  | 'createGroup'
  | 'declineJoinRequest'
  | 'deleteAccount'
  | 'deleteGroup'
  | 'deleteTags'
  | 'getAchievements'
  | 'getExploreDetails'
  | 'getExploreGroups'
  | 'getFeed'
  | 'getGroup'
  | 'getGroupPreview'
  | 'getJoinRequests'
  | 'getMe'
  | 'getMyGroups'
  | 'getMyRecentCheckIns'
  | 'getMyStats'
  | 'getTags'
  | 'getUserProfile'
  | 'joinGroupBySlug'
  | 'leaveGroup'
  | 'onCheckIn'
  | 'onHeart'
  | 'removeMember'
  | 'requestToJoin'
  | 'subscribe'
  | 'toggleHeart'
  | 'updateGroup'
  | 'updateProfile'
>

const impl: DataApi = DATA_SOURCE === 'supabase' ? remote : mock

export const {
  acceptJoinRequest,
  addTag,
  checkIn,
  createGroup,
  declineJoinRequest,
  deleteAccount,
  deleteGroup,
  deleteTags,
  getAchievements,
  getExploreDetails,
  getExploreGroups,
  getFeed,
  getGroup,
  getGroupPreview,
  getJoinRequests,
  getMe,
  getMyGroups,
  getMyRecentCheckIns,
  getMyStats,
  getTags,
  getUserProfile,
  joinGroupBySlug,
  leaveGroup,
  onCheckIn,
  onHeart,
  removeMember,
  requestToJoin,
  subscribe,
  toggleHeart,
  updateGroup,
  updateProfile,
} = impl
