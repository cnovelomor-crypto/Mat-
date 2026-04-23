# Security Specification for Matemágicas

## Data Invariants
1. A child can only belong to one parent at a time.
2. `starsEarned` (points) can only be added when an exercise is completed validly.
3. Only parents can mark a redemption as "completed".
4. Children can only see their own progress and redemptions.
5. Parents can see all activities related to their linked children.
6. A child cannot redeem a reward if they have insufficient points.

## The Dirty Dozen Payloads (Target: DENY)

1. **Identity Spoofing**: Child profile tries to set `parentId` to an arbitrary parent they don't belong to.
   - `PATCH /users/child_1 { "parentId": "random_parent" }`
2. **Privilege Escalation**: Child profile tries to change their role to "parent".
   - `PATCH /users/child_1 { "role": "parent" }`
3. **Point Inflation**: Child profile tries to manually set their `points` to 9999.
   - `PATCH /users/child_1 { "points": 9999 }`
4. **Illegal Exercise Log**: User A tries to log an exercise result for User B.
   - `POST /exerciseResults { "childId": "other_child", ... }`
5. **Unauthorized Reward Creation**: Child profile tries to create a reward in the global catalog.
   - `POST /rewards { "title": "Free Pizza", "cost": 0 }`
6. **Self-Completion**: Child profile tries to mark their own redemption as "completed".
   - `PATCH /redemptions/red_1 { "status": "completed" }`
7. **Negative Points Redemption**: Child profile tries to redeem a reward that costs more than they have. (Client logic should catch this, but rules must guard).
8. **Shadow Data**: Creating a user profile with extra fields like `isDeveloper: true`.
   - `POST /users/user_1 { "uid": "...", "role": "...", "isDeveloper": true }`
9. **Notification Hijacking**: User A tries to read notifications meant for User B.
   - `GET /notifications/not_1 (where notification.parentId != User A)`
10. **Timestamp Faking**: Child profile tries to set `timestamp` for an exercise to a future date manually.
11. **Reward Price Tampering**: Child profile tries to change the cost of an existing reward.
    - `PATCH /rewards/rew_1 { "cost": 1 }`
12. **Unauthorized Linking**: Child profile tries to link to a parent without a valid `linkingCode` verification on the server side (logic required in rules).

## Test Runner (firestore.rules.test.ts placeholder)
(I will implement valid rules later, this spec ensures we know what to block).
