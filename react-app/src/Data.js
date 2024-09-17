import { useEffect, useState } from 'react';

function Data() { 

    const [csvData, setCsvData] = useState([]);

    useEffect(() => { 
        fetch("/data.csv")
            .then((response) => response.text())
            .then((text) => { 
                const rows = text.split("\n").map((row) => row.split(','));
                setCsvData(rows.slice(1));
            })
            .catch((error) => console.log("Loading Error: ", error));
    }, []);





    return  (
        <>
            <p>Bungus</p>
            <ul>
                {csvData.map((row, index) => (
                    <li key={index}>{row.join(", ")}</li>
                ))}
            </ul>
        </>
    )
}

export default Data;