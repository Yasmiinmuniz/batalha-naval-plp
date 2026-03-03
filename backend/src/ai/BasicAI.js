import BaseAI from './BaseAI.js';

export default class BasicAI extends BaseAI {
    constructor(id, name) {
        super(id, name, 'basic');
    }

    //escolhe um movimento aleatorio
    getBestMove(opponentBoard) {
        const availableMoves = this._getAvailableMoves(opponentBoard);
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        return availableMoves[randomIndex];
    }
}