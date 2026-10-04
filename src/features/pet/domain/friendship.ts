import { foodIds, type FoodId } from './foods'

export type RewardId = 'ribbon' | 'strawberry' | 'ball' | 'flower'
export type WishAction = 'feed' | 'play' | 'pet'
export type Friendship = Readonly<{
  points: number
  daily: Readonly<{
    day: number
    feed: number
    play: number
    pet: number
    wishCompleted: boolean
  }>
}>

const dayLength = 86_400_000
const rewards = [
  { level: 2, points: 10, reward: 'ribbon' },
  { level: 3, points: 30, reward: 'strawberry' },
  { level: 4, points: 60, reward: 'ball' },
  { level: 5, points: 100, reward: 'flower' },
] as const
const wishes: readonly WishAction[] = ['feed', 'play', 'pet']

export function createFriendship(now: number, careCount = 0): Friendship {
  const thresholds = [0, ...rewards.map((reward) => reward.points)]
  const level = Math.min(4, Math.floor(careCount / 5))
  const start = thresholds[level]
  const next = thresholds[Math.min(4, level + 1)]
  return {
    points: start + Math.floor(((next - start) * (careCount % 5)) / 5),
    daily: {
      day: Math.floor(now / dayLength),
      feed: 0,
      play: 0,
      pet: 0,
      wishCompleted: false,
    },
  }
}

export function advanceFriendship(
  friendship: Friendship,
  now: number,
): Friendship {
  const day = Math.max(friendship.daily.day, Math.floor(now / dayLength))
  return day === friendship.daily.day
    ? friendship
    : { ...friendship, daily: createFriendship(now).daily }
}

export function friendshipView(pet: { friendship: Friendship }) {
  const { points, daily } = pet.friendship
  const next = rewards.find((reward) => points < reward.points)
  const unlocked: readonly RewardId[] = rewards
    .filter((reward) => points >= reward.points)
    .map((reward) => reward.reward)
  return {
    points,
    level: unlocked.length + 1,
    unlocked,
    availableFoods: foodIds.filter(
      (food) => food !== 'strawberry' || unlocked.includes('strawberry'),
    ),
    rewards,
    next: next ? { ...next, remaining: next.points - points } : null,
    wish: {
      action: wishes[daily.day % wishes.length],
      complete: daily.wishCompleted,
      rewardPoints: Math.min(6, 100 - points),
    },
  }
}
export type FriendshipView = ReturnType<typeof friendshipView>

export function foodAvailable(friendship: Friendship, food: FoodId): boolean {
  return (
    food !== 'strawberry' ||
    friendshipView({ friendship }).unlocked.includes(food)
  )
}

export function rewardCare(
  pet: { friendship: Friendship; fullness: number; happiness: number },
  action: 'feed' | 'play' | 'pet' | 'sleep' | 'wake',
): Friendship {
  const { friendship } = pet
  if (action === 'sleep' || action === 'wake') return friendship
  const useful =
    action === 'feed'
      ? pet.fullness < 85
      : action === 'play'
        ? pet.happiness < 90
        : true
  const limit = action === 'pet' ? 1 : 2
  const award = useful && friendship.daily[action] < limit
  const completesWish =
    !friendship.daily.wishCompleted &&
    friendshipView(pet).wish.action === action
  return {
    points: Math.min(
      100,
      friendship.points + (award ? 4 : 0) + (completesWish ? 6 : 0),
    ),
    daily: {
      ...friendship.daily,
      [action]: friendship.daily[action] + (award ? 1 : 0),
      wishCompleted: friendship.daily.wishCompleted || completesWish,
    },
  }
}
