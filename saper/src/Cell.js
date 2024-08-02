import { BOMB, EMPTY } from "./Game";

function Cell(props) {
    let nameClass = "";
    let value = "";
    if (props.state.opened && props.state.value === BOMB) {
        nameClass = "cellOpndBomb";
        value = "";
    } 
    else if (props.state.opened) {
        nameClass = "cellOpnd";
        if (props.state.value !== EMPTY) {
            value = props.state.value;  
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
                   onContextMenu={props.onClick}
                   disabled={props.state.disabled}>
                      {value}
           </button>
};

export default Cell;