/* @module  grove  -  HOME is the pacing mechanism, not decoration.

   A friend can hear you only in its own country (and faintly from the next one over), so
   the roster paces itself: however well you play, only the creatures who live in the
   Clearing can answer you there. No counters, no cooldowns, no invented numbers - the map
   does the work. This replaces "earn the calling, then be summoned" as the way a friend
   arrives, and it is what makes two players' collections differ: you meet who you travel
   past, in the order you get good at the things they love.

   [country, depth] - country is 0-14, depth is how far into its twenty levels the creature
   starts listening. Depth staggers arrivals so the back half of a country is not empty: one
   from the start, one around a third in, one near the door.

   The shape, deliberately front-loaded so builds exist early and the late game is about the
   party you have rather than the one you are still assembling:
     found per country  5 4 4 3 3 2 2 2 2 2 1 1 1 1 0   (33)
     plus 2 starters and 15 keystones given at the doors = 50

   Keystones are NOT here: they are gifts at doors, placed by KEYSTONE{}, and each hands you
   the friend for the country AHEAD so you arrive prepared rather than rewarded. */
/* ══ THE MAP IS roster-v2's MAP ══ this table predated the final country sheet and the
   two disagreed in play - the ant announced "it lives in The Bramblewood" while the sheet
   homes it in the Spore Hollow, visible to any player who spells ANT (caught in the
   replay). One truth now, synced to ds/roster-v2.md: the creature belongs to the land,
   the keeper lives with its trouble. Keystones are NOT here - doors are gifts. */
const HOME = {
  // First Clearing - the starters and the first-four engine, plus the small folk
  cat:[0,0], dog:[0,0], bee:[0,4], robin:[0,8], mouse:[0,11], dove:[0,13], chick:[0,16],
  // Bramblewood - thorn folk: the briar-born, the clever, the shine-lovers
  fox:[1,1], hare:[1,5], moth:[1,10], crow:[1,15],
  // Mosswood - soft ground, everything furred
  snail:[2,2], lamb:[2,7], deer:[2,11], pony:[2,15],
  // Spore Hollow - the drifting air
  fly:[3,2], ant:[3,8], skunk:[3,14],
  // Listening Pond - water birds and the rainbow trout
  heron:[4,2], duck:[4,8], fish:[4,14],
  // Reedmarsh - mud and tongue
  pig:[5,3], frog:[5,10],
  // Running River - nothing stays where you put it
  crab:[6,3], moose:[6,11],
  // Thunderfalls - the loud ones
  wolf:[7,3], bison:[7,11],
  // Undercave - the dark readers
  bat:[8,4], snake:[8,12],
  // Deep Dark - no light, and no need of it
  owl:[9,4], seal:[9,12],
  // the high country - one each, because by here the game is the party you have
  swan:[10,6], goat:[11,6], goose:[12,6], penguin:[13,6],
};
/* how many live in each country, for the Book's map and for the audit that keeps this
   honest - a curve edited by hand drifts silently otherwise */
const HOME_CURVE = [5,4,4,3,3,2,2,2,2,2,1,1,1,1,0];

/* =================== THE GROVE =================== */
