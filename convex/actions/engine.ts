'use node'
import { Id } from '../_generated/dataModel'
import { action } from '../_generated/server'
const jsChessEngine = require('js-chess-engine')
import { Chess } from 'chess.js'

export const maybeMakeComputerMove = action(async (ctx, id: Id<'games'>) => {
  const { runQuery, runMutation } = ctx
  const state = await runQuery('games:internalGetPgnForComputerMove', id)
  if (state === null) {
    return
  }
  const [pgn, strategy] = state
  const gameState = new Chess()
  gameState.loadPgn(pgn)
  const moveNumber = gameState.history().length
  const game = new jsChessEngine.Game(gameState.fen())
  let level = 1
  if (strategy === 'hard') {
    level = 2
  } else if (strategy === 'tricky') {
    if (moveNumber > 6) {
      level = 2
      if (moveNumber % 3 === 0) {
        level = 3
      }
    }
  }
  const aiMove = game.aiMove(level)
  // aiMove has format {moveFrom: moveTo}
  let moveFrom = Object.keys(aiMove)[0]
  let moveTo = aiMove[moveFrom]
  console.log(`move at level ${level}: ${moveFrom}->${moveTo}`)
  await runMutation(
    'games:internalMakeComputerMove',
    id,
    moveFrom.toLowerCase(),
    moveTo.toLowerCase()
  )
})
