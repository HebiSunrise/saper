import React, { MouseEventHandler } from "react";
import { BOMB, EMPTY } from "./Game";
import { ICell } from "./Game";

interface IProps {
    state: ICell, 
    onClick: MouseEventHandler<HTMLButtonElement>,
    onClickUp: () => void,
    onClickDown: () => void,
    onTouch: () => void,
    onMove: () => void
}

function Cell(props: IProps) {
    let nameClass = "";
    let value = "";
    if (props.state.opened && props.state.value === BOMB) {
        nameClass = "cellOpndBomb";
        value = "";
    } 
    else if (props.state.opened) {
        nameClass = "cellOpnd";
        if (props.state.value !== EMPTY) {
            value = String(props.state.value);  
        } else value = "";
    }
    else {
        nameClass = "cellClsd";
    }

    if (!props.state.opened && props.state.flaged){
        nameClass = "cellFlag";
    }

    return <button className={nameClass}
                   onClick={props.onClick}
                   onMouseUp={props.onClickUp}
                   onMouseDown={props.onClickDown}
                   onTouchEnd={props.onTouch}
                   onTouchStart={props.onClickDown}
                   onContextMenu={props.onClick}
                   onTouchMove={props.onMove}>
                      {value}
           </button>
};

export default Cell;