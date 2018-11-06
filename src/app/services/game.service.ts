import {Injectable, OnInit} from '@angular/core';
import {NativeStorage} from '@ionic-native/native-storage/ngx';

const newDice = () => JSON.parse(JSON.stringify([
    { pips: 0, locked: false },
    { pips: 0, locked: false },
    { pips: 0, locked: false },
    { pips: 0, locked: false },
    { pips: 0, locked: false }
]));
const newCategories = () => JSON.parse(JSON.stringify([
    { name: 'Ones', score: undefined },
    { name: 'Twos', score: undefined },
    { name: 'Threes', score: undefined },
    { name: 'Fours', score: undefined },
    { name: 'Fives', score: undefined },
    { name: 'Sixes', score: undefined },
    { name: 'Bonus', score: undefined },
    { name: '3 Oak', score: undefined },
    { name: '4 Oak', score: undefined },
    { name: '2+3 Oak', score: undefined },
    { name: '4 Str', score: undefined },
    { name: '5 Str', score: undefined },
    { name: '5 Oak', score: undefined },
    { name: 'Any', score: undefined }
]));
const newGame: any = {
    playing: true,
    turnsLeft: 13,
    rollsLeft: 3,
    dice: newDice(),
    category: undefined, // where to put the score, selected by user
    categories: newCategories(),
    subtotalLeft: 0,
    subtotalRight: 0,
    total: 0
};
const GAME_DATA = 'GAME_DATA';
const MIN_FOR_BONUS = 63;
const BONUS = 37;

@Injectable({
    providedIn: 'root'
})
export class GameService implements OnInit {

    public game: any = { ...newGame };

    constructor(private nativeStorage: NativeStorage) {
    }

    ngOnInit() {
        this.nativeStorage.getItem(GAME_DATA)
            .then(data => console.log('storage', data) && (this.game = data ? data : { ...newGame }),
                error => console.log('storage error', error) && (this.game = { ...newGame }));
    }

    public resetGame() {
        this.game = { ...newGame };
        this.game.dice.forEach((die) => die.pips = 0 && (die.locked = false));
        this.game.categories.forEach((cat) => cat.score = undefined);
        return this.nativeStorage.setItem(GAME_DATA, this.game);
    }

    public getScore (catName) {
        switch (catName) {
            case 'Ones':
                return this.getPipsCount(1);
            case 'Twos':
                return this.getPipsCount(2) * 2;
            case 'Threes':
                return this.getPipsCount(3) * 3;
            case 'Fours':
                return this.getPipsCount(4) * 4;
            case 'Fives':
                return this.getPipsCount(5) * 5;
            case 'Sixes':
                return this.getPipsCount(6) * 6;

            case '3 Oak':
                return this.getOAKScore(3);
            case '4 Oak':
                return this.getOAKScore(4);
            case '2+3 Oak':
                return this.game.dice.filter(die => die.pips === 3).length * 3;
            case '4 Str':
                return this.game.dice.filter(die => die.pips === 4).length * 4;
            case '5 Str':
                return this.game.dice.filter(die => die.pips === 5).length * 5;
            case '5 Oak':
                return this.getOAKScore(5) > 0 ? 50 : 0;
            case 'Any':
                return this.getDiceTotal();

            default:
                return 0;
        }
    }

    public save() {
        this.game.category = undefined;
        this.game.subtotalLeft = this.game.categories.slice(0, 6)
            .reduce((total, cat) => total + (cat.score || 0), 0);
        const bonus = this.game.categories.find(cat => cat.name === 'Bonus');
        if (this.game.subtotalLeft >= MIN_FOR_BONUS) {
            bonus.score = BONUS;
            this.game.subtotalLeft += BONUS;
        }
        this.game.subtotalRight = this.game.categories.slice(7)
            .reduce((total, cat) => total + (cat.score || 0), 0);
        this.game.total = this.game.subtotalLeft + this.game.subtotalRight;

        this.game.rollsLeft = 3;
        this.game.dice = newDice();
        this.game.turnsLeft--;
    }

    public setSelectedCategory(catName) {
        if (catName !== 'Bonus') {
            if (this.game.category) {
                this.game.categories.find(c => c.name === this.game.category).score = undefined;
            }
            if (this.game.rollsLeft < 3) {
                this.game.category = catName;
                if (catName) {
                    this.game.categories.find(c => c.name === catName).score = this.getScore(catName);
                }
            }
        }
    }

    getOAKScore(howManyOAK) {
        const mode = this.getMode(this.game.dice);
        return (this.getPipsCount(mode) >= howManyOAK ? this.getDiceTotal() : 0);
    }

    getMode(myArray) {
        return myArray.reduce((a, b, i, arr) =>
                (arr.filter(v => v.pips === a).length >= arr.filter(v => v.pips === b.pips).length ? a : b.pips),
            null);
    }

    getDiceTotal() {
        return this.game.dice.reduce((total, die) => total + (die.pips || 0), 0);
    }

    getPipsCount(pips) {
        return this.game.dice.filter(die => (die.pips === pips)).length;
    }

}
