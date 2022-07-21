import * as Chess from 'chess.js'
import { BehaviorSubject } from 'rxjs'

const chess = new Chess()

export const gameSubject = new BehaviorSubject()

export function initGame() {
    const savedGame = localStorage.getItem('savedGame')
    if (savedGame) {
        chess.load(savedGame)
    }
    updateGame()
}

export function resetGame() {
    chess.reset()
    updateGame()
}

export function handleMove(from, to) {
    const promotions = chess.moves({ verbose: true }).filter(m => m.promotion)
    console.table(promotions)
    if (promotions.some(p => `${p.from}:${p.to}` === `${from}:${to}`)) {
        const pendingPromotion = { from, to, color: promotions[0].color }
        updateGame(pendingPromotion)
    }
    const { pendingPromotion } = gameSubject.getValue()

    if (!pendingPromotion) {
        move(from, to)
    }
}


export function move(from, to, promotion) {
    let tempMove = { from, to }
    if (promotion) {
        tempMove.promotion = promotion
    }
    const legalMove = chess.move(tempMove)

    if (legalMove) {
        updateGame()
    }
}

function updateGame(pendingPromotion) {
    const isGameOver = chess.game_over()

    const newGame = {
        board: chess.board(),
        pendingPromotion,
        isGameOver,
        turn: chess.turn(),
        result: isGameOver ? getGameResult() : null
    }

    localStorage.setItem('savedGame', chess.fen())

    gameSubject.next(newGame)
}
function getGameResult() {
    if (chess.in_checkmate()) {
        const winner = chess.turn() === "w" ? 'Чёрные' : 'Белые'
        return `МАТ - ПОБЕДИТЕЛЬ - ${winner}`
    } else if (chess.in_draw()) {
        let reason = 'ПРАВИЛО - 50 - ХОДОВ'
        if (chess.in_stalemate()) {
            reason = 'БЕЗВЫХОДНОЕ ПОЛОЖЕНИЕ'
        } else if (chess.in_threefold_repetition()) {
            reason = 'ПОВТОРЕНИЕ ХОДОВ'
        } else if (chess.insufficient_material()) {
            reason = "НЕДОСТАТОК ФИГУР"
        }
        return `РЕЗУЛЬТАТ - ${reason}`
    } else {
        return 'НЕИЗВЕСТНО'
    }
}