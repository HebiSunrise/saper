import React from 'react';
import Board from './Board';
import Menu from './Menu';

export const BOMB = -1;
export const EMPTY = 0;

const LEFT_CLICK = 0;
const RIGHT_CLICK = 2;

const LONG_PRESS_MS = 500;

interface IDifficulty {
    width: number;
    height: number;
    bombs: number;
    minWidth: number;
}

const DIFFICULTY: IDifficulty[] = [
    { width: 8, height: 8, bombs: 10, minWidth: 370 },
    { width: 18, height: 16, bombs: 40, minWidth: 820 },
    { width: 24, height: 20, bombs: 99, minWidth: 1080 },
];

type Status = 'playing' | 'won' | 'lost';

interface IProps { }

interface IState {
    infoOfCells: ICell[][];
    complexity: number;
    time: number;
    widthBoard: number;
    status: Status;
    countFlags: number;
}

export interface ICell {
    opened: boolean;
    value: number;
    disabled: boolean;
    flaged: boolean;
}

interface IPosition {
    x: number;
    y: number;
}

class Game extends React.Component<IProps, IState> {
    private timerId: ReturnType<typeof setInterval> | null = null;
    private longPressTimerId: ReturnType<typeof setTimeout> | null = null;
    private longPressFired = false;
    private bombsPlaced = false;

    constructor(props: IProps) {
        super(props);
        this.state = {
            infoOfCells: [],
            complexity: 0,
            time: 0,
            widthBoard: 0,
            status: 'playing',
            countFlags: 0,
        };

        this.handleClick = this.handleClick.bind(this);
        this.onTouch = this.onTouch.bind(this);
        this.newGame = this.newGame.bind(this);
        this.getCompl = this.getCompl.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.onPressDown = this.onPressDown.bind(this);
        this.onPressUp = this.onPressUp.bind(this);
        this.onMove = this.onMove.bind(this);
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
        this.newGame();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
        this.stopTimer();
        this.cancelLongPressTimer();
    }

    handleResize() {
        const cfg = DIFFICULTY[this.state.complexity];
        const boardWidth = window.innerWidth < cfg.minWidth ? cfg.minWidth : 0;
        this.setState({ widthBoard: boardWidth });
    }

    getCompl(difficult: number) {
        if (difficult < 0 || difficult >= DIFFICULTY.length) return;
        this.setState({ complexity: difficult });
    }

    private cloneCells(cells: ICell[][]): ICell[][] {
        return cells.map(row => row.map(c => ({ ...c })));
    }

    private startTimer() {
        if (this.timerId !== null) return;
        this.timerId = setInterval(() => {
            this.setState(s => ({ time: s.time + 1 }));
        }, 1000);
    }

    private stopTimer() {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    private statusLabel(status: Status, flags: number, bombs: number): string {
        if (status === 'won') return 'You win!';
        if (status === 'lost') return 'You lose!';
        return `Bombs found ${flags}/${bombs}`;
    }

    private applyAction(y: number, x: number, longPress: boolean, isRightClick: boolean) {
        if (this.state.status !== 'playing') return;

        const cells = this.cloneCells(this.state.infoOfCells);
        let nextStatus: Status = 'playing';
        let nextFlags = this.state.countFlags;

        if (isRightClick || longPress) {
            const cell = cells[y][x];
            if (!cell.opened) {
                if (!cell.flaged) {
                    cell.flaged = true;
                    cell.disabled = true;
                    nextFlags++;
                } else {
                    cell.flaged = false;
                    cell.disabled = false;
                    nextFlags--;
                }
            }
        } else {
            if (!this.bombsPlaced) {
                const height = cells.length;
                const width = cells[0].length;
                const bombs = DIFFICULTY[this.state.complexity].bombs;
                this.placeBombs(cells, width, height, bombs, x, y);
                this.computeNumbers(cells);
                this.bombsPlaced = true;
            }
            this.startTimer();
            const lost = this.openCells(cells, x, y);
            if (lost) {
                this.revealAllOnLose(cells);
                nextStatus = 'lost';
                this.stopTimer();
            } else if (this.checkWin(cells)) {
                this.finalizeWin(cells);
                nextStatus = 'won';
                this.stopTimer();
            }
        }

        this.setState({
            infoOfCells: cells,
            status: nextStatus,
            countFlags: nextFlags,
        });
    }

    private cancelLongPressTimer() {
        if (this.longPressTimerId !== null) {
            clearTimeout(this.longPressTimerId);
            this.longPressTimerId = null;
        }
    }

    onPressDown(y: number, x: number) {
        this.longPressFired = false;
        this.cancelLongPressTimer();
        this.longPressTimerId = setTimeout(() => {
            this.longPressTimerId = null;
            this.longPressFired = true;
            this.applyAction(y, x, true, false);
        }, LONG_PRESS_MS);
    }

    onPressUp() {
        this.cancelLongPressTimer();
    }

    onMove() {
        this.cancelLongPressTimer();
        this.longPressFired = true;
    }

    onTouch(y: number, x: number) {
        if (this.longPressFired) {
            this.longPressFired = false;
            return;
        }
        this.cancelLongPressTimer();
        this.applyAction(y, x, false, false);
    }

    handleClick(e: React.MouseEvent<HTMLButtonElement>, y: number, x: number) {
        const iOS = navigator.userAgent.match(/iPhone|iPad|iPod/i);
        if (iOS != null) return;

        e.preventDefault();

        if (this.longPressFired) {
            this.longPressFired = false;
            this.cancelLongPressTimer();
            return;
        }
        this.cancelLongPressTimer();

        const btn = e.nativeEvent.button;
        if (btn !== LEFT_CLICK && btn !== RIGHT_CLICK) return;
        this.applyAction(y, x, false, btn === RIGHT_CLICK);
    }

    private randomInRange(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private placeBombs(
        cells: ICell[][],
        width: number,
        height: number,
        bombs: number,
        safeX: number,
        safeY: number,
    ) {
        const totalCells = width * height;
        const safe = new Set<number>();
        const useNeighborhood = bombs <= totalCells - 9;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (!useNeighborhood && (dx !== 0 || dy !== 0)) continue;
                const nx = safeX + dx;
                const ny = safeY + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    safe.add(ny * width + nx);
                }
            }
        }

        let count = bombs;
        while (count > 0) {
            const bx = this.randomInRange(0, width - 1);
            const by = this.randomInRange(0, height - 1);
            if (cells[by][bx].value === EMPTY && !safe.has(by * width + bx)) {
                cells[by][bx].value = BOMB;
                count--;
            }
        }
    }

    private openCells(cells: ICell[][], x: number, y: number): boolean {
        const height = cells.length;
        const width = cells[0].length;
        const start = cells[y][x];
        if (start.flaged) return false;

        if (start.value === BOMB) {
            start.opened = true;
            return true;
        }

        const stack: IPosition[] = [{ x, y }];
        while (stack.length > 0) {
            const p = stack.pop()!;
            const c = cells[p.y][p.x];
            if (c.opened || c.flaged) continue;

            c.opened = true;
            c.disabled = true;

            if (c.value === EMPTY) {
                for (let i = p.y - 1; i <= p.y + 1; i++) {
                    for (let j = p.x - 1; j <= p.x + 1; j++) {
                        if (i === p.y && j === p.x) continue;
                        if (i < 0 || i >= height || j < 0 || j >= width) continue;
                        const n = cells[i][j];
                        if (!n.opened && !n.flaged && n.value !== BOMB) {
                            stack.push({ x: j, y: i });
                        }
                    }
                }
            }
        }
        return false;
    }

    private computeNumbers(cells: ICell[][]) {
        const height = cells.length;
        const width = cells[0].length;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (cells[y][x].value === BOMB) continue;
                let count = 0;
                for (let i = y - 1; i <= y + 1; i++) {
                    for (let j = x - 1; j <= x + 1; j++) {
                        if (i === y && j === x) continue;
                        if (i < 0 || i >= height || j < 0 || j >= width) continue;
                        if (cells[i][j].value === BOMB) count++;
                    }
                }
                cells[y][x].value = count;
            }
        }
    }

    private revealAllOnLose(cells: ICell[][]) {
        cells.forEach(row => row.forEach(cell => {
            cell.disabled = true;
            if (cell.value === BOMB) cell.opened = true;
        }));
    }

    private checkWin(cells: ICell[][]): boolean {
        for (const row of cells) {
            for (const cell of row) {
                if (cell.value !== BOMB && !cell.opened) return false;
            }
        }
        return true;
    }

    private finalizeWin(cells: ICell[][]) {
        const key = String(this.state.complexity);
        const time = this.state.time;
        const prev = window.localStorage.getItem(key);
        if (prev === null || time < Number(prev)) {
            window.localStorage.setItem(key, String(time));
        }
        cells.forEach(row => row.forEach(cell => {
            if (!cell.opened) {
                cell.flaged = true;
                cell.disabled = true;
            }
        }));
    }

    newGame() {
        this.bombsPlaced = false;
        this.stopTimer();

        this.setState(prev => {
            const { width, height } = DIFFICULTY[prev.complexity];
            const cells: ICell[][] = [];
            for (let y = 0; y < height; y++) {
                cells[y] = [];
                for (let x = 0; x < width; x++) {
                    cells[y][x] = { opened: false, value: EMPTY, disabled: false, flaged: false };
                }
            }
            return {
                infoOfCells: cells,
                time: 0,
                countFlags: 0,
                status: 'playing' as Status,
            };
        }, () => this.handleResize());
    }

    render() {
        const { widthBoard, infoOfCells, time, status, countFlags, complexity } = this.state;
        const bombs = DIFFICULTY[complexity].bombs;
        const statusLabel = this.statusLabel(status, countFlags, bombs);

        return (
            <div style={{ width: widthBoard === 0 ? '100%' : widthBoard, transition: '1s' }}>
                <Menu newGame={this.newGame}
                    status={statusLabel}
                    timer={time}
                    changeDif={this.getCompl} />
                <div style={{ width: '100%', transition: '1s' }}>
                    <Board state={infoOfCells}
                        onClick={this.handleClick}
                        onTouch={this.onTouch}
                        onMove={this.onMove}
                        onClickDown={this.onPressDown}
                        onClickUp={this.onPressUp} />
                </div>
            </div>
        );
    }
}

export default Game;
