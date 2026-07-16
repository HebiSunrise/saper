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

    if (!props.state.opened && props.state.flaged) {
        nameClass = "cellFlag";
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (e.button === 0) props.onClickDown();
    };

    return <button className={nameClass}
        onClick={props.onClick}
        onMouseDown={handleMouseDown}
        onMouseUp={props.onClickUp}
        onMouseLeave={props.onClickUp}
        onTouchStart={props.onClickDown}
        onTouchEnd={props.onTouch}
        onTouchMove={props.onMove}
        onContextMenu={props.onClick}>
        {value}
    </button>
};

export default Cell;