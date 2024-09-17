import { useEffect, useState } from 'react';
import Graph from './Graph';

function Data() { 

    const [csvData, setCsvData] = useState([]);

    useEffect(() => { 
        fetch("/data.csv")
            .then((response) => response.text())
            .then((text) => { 
                const rows = text.split("\n").map((row) => row.split(','));
                const formattedData = rows.slice(1).map(row => [parseFloat(row[1]), 0, 0]);
                setCsvData(formattedData);
            })
            .catch((error) => console.log("Loading Error: ", error));
    }, []);





    return  (
        <>
            <Graph dataFromCsv={csvData}/>
            <ul>
                {csvData.map((row, index) => (
                    <li key={index}>{row.join(", ")}</li>
                ))}
            </ul>
        </>
    )
}

export default Data;