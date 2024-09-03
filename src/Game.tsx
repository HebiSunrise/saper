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
let timerId: NodeJS.Timeout;
let timePressDown: number;
let timePressUp: number;
let moved = false;

interface IProps {}

interface IState {
    infoOfCells: ICell[][], 
    complexity: number,
    time: number
}

export interface ICell {
    opened: boolean,
    value: number,
    disabled: boolean, 
    flaged: boolean
}

interface IPosition {
    x: number,
    y: number
}

class Game extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);
        this.state = {
            infoOfCells: [], 
            complexity: 0,
            time: 0
        };

        this.handleClick = this.handleClick.bind(this);
        this.onTouch = this.onTouch.bind(this);
        this.newGame = this.newGame.bind(this);
        this.getCompl = this.getCompl.bind(this);
    }

    componentDidMount() {
        this.newGame();
    }
  
    getCompl(difficult: number) {
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

    onLeftClick(y:number, x:number, cells:ICell[][]) {
        

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
    
        this.openCells(cells[y][x], x, y);
                
        this.isWin();
    }

    onRightClick(y:number, x:number, cells:ICell[][]) {
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

    onPressDown() {
        timePressDown = Number(new Date());
    }

    onPressUp() {
        timePressUp = Number(new Date());
    }

    onMove(){
        moved = true;
    }

    onTouch(y:number, x:number) {
        if (moved) {
            moved = false;
            return
        }

        let whichBtn;
        this.onPressUp();
        if (timePressUp - timePressDown > 1000) whichBtn = RIGHT_CLICK
        else whichBtn = LEFT_CLICK
        const cells = this.state.infoOfCells;
        if (status === "You win!" || status === "You lose!") return;

        switch (whichBtn) {
            case LEFT_CLICK: 
                if (timePressUp - timePressDown > 500) 
                    this.onRightClick(y, x, cells); 
                else this.onLeftClick(y, x, cells);
                break;
            case RIGHT_CLICK: this.onRightClick(y, x, cells); break;
            default: break;
        }  
        
        this.setState({
            infoOfCells: cells
        });  
    }

    handleClick(e:React.MouseEvent<HTMLButtonElement>, y:number, x:number) {
        const cells = this.state.infoOfCells;
        var iOS = navigator.userAgent.match(/iPhone|iPad|iPod/i);
        if (iOS != null) return

        e.preventDefault();
        if (status === "You win!" || status === "You lose!") return;

        switch (e.nativeEvent.button) {
            case LEFT_CLICK: 
                if (timePressUp - timePressDown > 1000) 
                    this.onRightClick(y, x, cells); 
                else this.onLeftClick(y, x, cells);
                break;
            case RIGHT_CLICK: this.onRightClick(y, x, cells); break;
            default: break;
        }  
         
        this.setState({
            infoOfCells: cells
        });
    }

    randomNumberInRange = (min:number, max:number) => {
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

    openCells(cell: ICell, x:number, y:number) {
        const cells = this.state.infoOfCells;
        if (cell.flaged === true) return; 
        
        if (cell.value === BOMB) {
            cells[y][x].opened = true;
            this.isLose();
            return;
        }
        
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

    getNeighbors(x:number, y:number, mask = [[1, 1, 1,], [1, 0, 1], [1, 1, 1]]): IPosition[] {
        const neighbors: IPosition[] = [];
        for (let i = y - 1; i <= y + 1; i++) {
            for (let j = x - 1; j <= x + 1; j++) {
                if (i >= 0 && i < height && j >= 0 && j < width && mask[i - (y - 1)][j - (x - 1)] === 1) {
                    neighbors.push({x: j, y: i});
                }
            }
        }
        return neighbors;
    }

    setInfoCells() {
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

            const complexity = String(this.state.complexity);
            const time = String(this.state.time);

            if (window.localStorage.getItem(complexity) === null){
                window.localStorage.setItem(complexity, time);
            }

            if (this.state.time < Number(window.localStorage.getItem(complexity))) {
                window.localStorage.setItem(complexity, time);
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
                       onClick={this.handleClick}
                       onTouch={this.onTouch}
                       onMove={this.onMove}
                       onClickDown={this.onPressDown}
                       onClickUp={this.onPressUp}/> 
            </div>
        );
    }
}

export default Game