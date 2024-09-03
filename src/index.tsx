import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Game from './Game';
import './Cells.css';

const element = document.getElementById('root');

if (element != null) {
    const root = ReactDOM.createRoot(element);
    
    root.render(
        <Game />
    );
}
