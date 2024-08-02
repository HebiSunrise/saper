import Cell from "./Cell"

function Board(props) {
    const field = props.state.map((row, y) => {
        const rowOfCells = row.map((cell, x) => {
            const id = row.length * y + x;
            return <Cell key={id}
                        onClick={(e) => props.onClick(e, y, x)}
                        state={cell} />
        });
        return <div key={y} className='row'>{rowOfCells}</div>
    });
    return <div className='cells'>{field}</div>;
}

export default Board;

