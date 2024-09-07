import React from "react";
import Cell from "./Cell"
import { ICell } from "./Game";

interface IProps {
   state: ICell[][],
   onClick: (e:React.MouseEvent<HTMLButtonElement>, y:number, x:number) => void,
   onTouch: (y:number, x:number) => void,
   onClickDown: () => void,
   onClickUp: () => void,
   onMove: () => void
}

function Board(props:IProps) {
    const field = props.state.map((row, y) => {
        const rowOfCells = row.map((cell, x) => {
            const id = row.length * y + x;
            return <Cell key={id}
                        onClick={(e) => props.onClick(e, y, x)}
                        onTouch={() => props.onTouch(y, x)}
                        onClickDown={props.onClickDown}
                        onClickUp={props.onClickUp}
                        onMove={props.onMove}
                        state={cell} />
        });
        return <div key={y} className='row'>{rowOfCells}</div>
    });
    return <div className="board">
        <div className='cells'>{field}</div>
        <div className="info">
            <p>Hold the cell to set or remove the</p>
            <p className="flag">flag</p>
        </div>
    </div>
}

export default Board;

