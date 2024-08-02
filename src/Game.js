import React from 'react';
import Board from './Board';
import Menu from './Menu';

export const BOMB = -1;
export const EMPTY = 0;

const LEFT_CLICK = 0;
const RIGHT_CLICK = 2;

let width = 8;
let height = 8;
let countBombs = 10;
let status = "";
let countFlags = 0;
let isTimerOn = false; 
let timer = 0; 
let timerId;

class Game extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            infoOfCells: [], 
            complexity: 0,
            time: 0
        };

        this.handleClick = this.handleClick.bind(this);
        this.newGame = this.newGame.bind(this);
        this.getCompl = this.getCompl.bind(this);

    }

    componentDidMount() {
        this.newGame();
    }
  
    getCompl(difficult) {
        this.setState({
            complexity: difficult
        });

        switch (difficult) {
            case 0:
                width = 8; 
                height = 8;
                countBombs = 10;
                break;
            case 1:
                width = 18; 
                height = 16;
                countBombs = 40;
                break;
            case 2: 
                width = 24; 
                height = 20;
                countBombs = 99;
                break;
            default:
                break;
        }
    }

    onRightClick(y, x, cells) {
        if (!isTimerOn) {
            isTimerOn = true; 
            timerId = setInterval(() => {
                if (isTimerOn){
                    timer++;
                    this.setState({
                        time: timer
                    });
                } else {
                    clearInterval(timerId);
                }
            }, 1000);
        }
    
        if (cells[y][x].value === BOMB) {
            this.isLose();
        }
        
        this.openCells(cells[y][x], x, y);
        this.isWin();
    }

    onLeftClick(y, x, cells) {
        if (cells[y][x].flaged === false && !cells[y][x].opened) {
            cells[y][x].disabled = true;
            cells[y][x].flaged = true;
            countFlags++;
        } 
        else if (cells[y][x].flaged === true && !cells[y][x].opened) {
            cells[y][x].disabled = false;
            cells[y][x].flaged = false;
            countFlags--;
        }
    
        status = "Bombs found " + countFlags + "/" + countBombs;
    }

    handleClick(e, y, x) {
        const cells = this.state.infoOfCells;
        e.preventDefault();
        if (status === "You win!" || status === "You lose!") return;
        
        switch (e.nativeEvent.button) {
            case LEFT_CLICK: this.onRightClick(y, x, cells); break;
            case RIGHT_CLICK: this.onLeftClick(y, x, cells); break;
            default: break;
        }    
        
        this.setState({
            infoOfCells: cells
        });
    }

    randomNumberInRange = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    setBombs () {
        let count = countBombs;
        const bombs = this.state.infoOfCells;
        while (count > 0) {
            const mbBombX = this.randomNumberInRange(0, width-1);
            const mbBombY = this.randomNumberInRange(0, height-1);

            if (bombs[mbBombY][mbBombX].value === EMPTY) {
                bombs[mbBombY][mbBombX].value = BOMB;
                count--;
            }
        }

        this.setState({
            infoOfCells: bombs
        });
    }

    openCells(cell, x, y) {
        const cells = this.state.infoOfCells;
        if (cell.value === BOMB) {
            cells[y][x].opened = true;
            return;
        }
        
        if (cell.flaged === true) return; 

        if (cell.value !== EMPTY) {
            cells[y][x].opened = true;
            cells[y][x].disabled = true;
            return;
        }

       
        if (cell.opened === true) return; 
        
        cells[y][x].opened = true;
        cells[y][x].disabled = true;

        const neighbors = this.getNeighbors(x, y);
        neighbors.map((neighbor, i) => {
            return this.openCells(cells[neighbor.y][neighbor.x], neighbor.x, neighbor.y);
        });
        
        this.setState({
            infoOfCells: cells
        });
    }

    getNeighbors(x, y, mask = [[1, 1, 1,], [1, 0, 1], [1, 1, 1]]) {
        const neighbors = [];
        for (let i = y - 1; i <= y + 1; i++) {
            for (let j = x - 1; j <= x + 1; j++) {
                if (i >= 0 && i < height && j >= 0 && j < width && mask[i - (y - 1)][j - (x - 1)] === 1) {
                    neighbors.push({x: j, y: i});
                }
            }
        }
        return neighbors;
    }

    setInfoCells(x, y) {
        const cells = this.state.infoOfCells;
        for(let y = 0; y < height; y++) {
            for(let x = 0; x < width; x++) {
                if (cells[y][x].value === BOMB) continue;
                
                const neighbors = this.getNeighbors(x, y);
                let count = 0;
                for(const neighbor of neighbors) {
                    if(cells[neighbor.y][neighbor.x].value === BOMB)
                        count++;
                }

                cells[y][x].value = count;
                
                this.setState({
                    infoOfCells: cells
                });
            }
        }        
    }

    isLose() {
        const cells = this.state.infoOfCells;
        cells.forEach((row) => {
            row.forEach((cell) => {
                cell.disabled = true;
                if (cell.value === BOMB) {
                    cell.opened = true;
                }
            });
        });

        this.setState({
            infoOfCells: cells
        });

        status = "You lose!";
        isTimerOn = false;
        clearInterval(timerId)
    }

    isWin() {
        const cells = this.state.infoOfCells;
        let countEmpty = 0;
        
        cells.forEach((row) => {
            row.forEach((cell) => {
                if (cell.value !== BOMB && cell.opened === false){
                    countEmpty++;
                }
            });
        });

        if (countEmpty === 0){
            status = "You win!";
            isTimerOn = false;
            clearInterval(timerId);

            if (window.localStorage.getItem(this.state.complexity) === null){
                window.localStorage.setItem(this.state.complexity, this.state.time);
            }

            if (this.state.time<window.localStorage.getItem(this.state.complexity)) {
                window.localStorage.setItem(this.state.complexity, this.state.time);
            }

            cells.forEach((row) => {
                row.forEach((cell) => {
                    if (cell.opened === false){
                        cell.flaged = true;
                        cell.disabled = true;
                    }
                });
            });
        }
    }

    newGame(){
        
        this.setState({
            infoOfCells: []
        });
        const cells = this.state.infoOfCells;
        for (let f = 0; f < cells.length; f++) cells[f] = [];
        for (let y = 0; y < height; y++) { 
            cells[y] = [];
            for (let x = 0; x < width; x++) {
                cells[y][x] = {
                    opened: false,
                    value: EMPTY,
                    disabled: false, 
                    flaged: false
                };
            }
        }

        this.setBombs();
        this.setInfoCells();

        this.setState({
            infoOfCells: cells,
            time: 0
        });
        countFlags = 0;
        status = "Bombs found " + countFlags + "/" + countBombs;
        isTimerOn = false;
        clearInterval(timerId);
        timer = 0; 
    }

    render() {
        return (
            <div>
                <Menu newGame={this.newGame} 
                      status={status} 
                      timer={this.state.time} 
                      changeDif={this.getCompl} />
                <Board state={this.state.infoOfCells} 
                       dif={this.state.complexity} 
                       onClick={this.handleClick}/> 
            </div>
        );
    }
}

export default Game