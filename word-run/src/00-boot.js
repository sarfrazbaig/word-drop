"use strict";
/* ============ 🗺️ HOW THIS FILE IS LAID OUT ============
   One file, because a game that ships as a single page loads fastest that way, and one
   file is genuinely the right answer right up until it isn't. It stopped being the right
   answer somewhere around nine thousand lines: the sections below are honest boundaries
   that nothing enforces, so anything can reach anything, and twice in one afternoon a
   careful search over this file returned a confident wrong answer about its own contents.

   The plan is TypeScript modules before launch, not after - once players' saves are in
   the wild, moving this becomes an operation with stakes. Each banner below names the
   file it becomes, so that migration is a cut rather than a judgement:

     dictionary   the word list, injected by build.js
     world        board size, biomes, decor, obstacle debuts
     signs        every event a friend can listen for            ← already split out
     grove        the fifty friends as data, callings, gates, goals
     powers       what each friend does, one function each       ← already split out
     save         P and localStorage
     round        S, true only mid-round
     tiles        tile elements
     words        reading the board - PURE, so it gets tests first
     game         the rules
     ui           screens, cards, animation
     input        pointer and stage fitting
     audit        the checks a type system will replace          ← already split out

   The three marked ones were pulled out first on purpose: they are the ones the pet work
   is about to touch, and doing them now means that work lands in the new shape rather
   than being migrated twice. Everything below the fold is still one scope - that is known,
   and it is the next job, not a surprise. */

/* =================== DICTIONARY =================== */
