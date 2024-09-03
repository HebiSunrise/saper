import { useState } from 'react';
import './Menu.css';
import React from 'react';

export let dif = 0; 
const EASY = 0;
const MEDIUM = 1;
const HARD = 2;

interface IProps {
    changeDif: (difNumbr:number) => void,
    newGame: () => void,
    status: string,
    timer: number
}

function Menu (props:IProps) {
    const [stn, stnState] = useState('stnClsd'); 
    let stnClass = stn;
    
    function handleClick () {
        if (stn === 'stnClsd') {
            stnState('stnOpn');
        } else stnState('stnClsd');
        return 
    }

    function btnDif(strinId:string, difNumbr:number, difLabel:string) {
        return (
            <div>
                <input type="radio" 
                        id={strinId} 
                        name="drone" 
                        value={strinId}
                        defaultChecked = {dif === difNumbr ? true : false}
                        onClick={() => {
                            dif = difNumbr; 
                            props.changeDif(difNumbr);
                            props.newGame();
                            handleClick();
                        }} />
                <label htmlFor={strinId}>
                    <div className="point">
                        {difLabel}
                    </div>
                </label>
            </div>
        )
    }
    
    return (
        <div className='menu'>
            <div className='nav'>   
                <button className="navBut"
                        onClick={props.newGame}>
                    New game
                </button>
                <button className="navBut"
                        onClick={handleClick}>
                    Settings
                </button>
            </div>
            <div className={stnClass}>   
                <fieldset>
                    <legend>Select a complexity:</legend>
                    
                    {btnDif("easy", EASY, "Easy")}
                    {btnDif("medium", MEDIUM, "Medium")}
                    {btnDif("hard", HARD, "Hard")}

                    
                </fieldset>
            </div>
            <div className='status'>
                <div className='counter'>   
                    <p>{props.status}</p>
                </div>
                <div className='timer'>   
                    <p>Time {props.timer} | Best {window.localStorage.getItem(String(dif))}</p>
                </div>
            </div>
        </div>
    )
}


export default Menu;