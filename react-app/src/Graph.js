import { useState, useEffect, useRef } from 'react'

function Graph(dataFromCsv) { 

    const [mode, setMode] = useState("Split");

    const canvasRef = useRef(null);
    const height = 600;

    const [verticalLines, setVerticalLines] = useState([]);


    const initialData = dataFromCsv.length > 0 
        ? dataFromCsv['dataFromCsv'] : 
        Array.from({length: 300}, () => [0, 0, 0])
    const [dataPoints, setDataPoints] = useState(initialData);

    useEffect(() => { 
        const adjustedData = dataFromCsv['dataFromCsv'];
        setDataPoints(adjustedData);
    }, [dataFromCsv]);





    function getClickedId(event) { 
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const x_step = canvas.width / (dataPoints.length - 1);
        const index = Math.floor(x / x_step);
        const pointId = dataPoints[index][1];
        // console.log(pointId);

        return pointId;
    }

    function updateColorById(id) { 
        const updatedPoints = dataPoints.map(point => {
            const pointId = point[1];
            if (pointId == id) { 
                return [point[0], point[1], point[2] + 1];
            }
            return point;
        
        });
        setDataPoints(updatedPoints);
    }

    function addVeriticalLine(event) { 
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;


        setVerticalLines(prevLines => {
            const newLines = [...prevLines, x].sort((a, b) => a - b);
            updatePointIds(newLines);
            return newLines;
        });

    }




    function updatePointIds(verticalLines) { 
        const canvas = canvasRef.current;
        const x_step = canvas.width / (dataPoints.length - 1);

        // dataPoints.forEach(point => console.log(point));

        const updatedPoints = dataPoints.map((point, index) => { 
            const x = x_step * index; // x pos on graph
            let newId = 0;

            for (let i = 0; i < verticalLines.length; i++) {
                if (x > verticalLines[i]) { 
                    newId = i + 1;
                }
                else { 
                    break;
                }
            }

            return [point[0], newId, point[2]];
        });

        // updatedPoints.forEach(point => console.log(point));

        setDataPoints(updatedPoints);

    }


    function drawGraph() {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const x_step = canvas.width / (dataPoints.length - 1);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;

        // draw datapoints graph
        dataPoints.forEach((point, index) => { 


            const x = index * x_step;
            const price = height - point[0];
            const id = point[1];
            const color = point[2];

            if (index > 0) { 

                
                const prevX = (index - 1) * x_step;

                const prevPoint = dataPoints[index - 1];
                const prevPrice = height - prevPoint[0];
                const prevId = prevPoint[1]


                if (color % 4 == 0) {
                    ctx.strokeStyle = "blue";
                }
                else if (color % 4 == 1) {
                    ctx.strokeStyle = "red";
                }
                else if (color % 4 == 2) {
                    ctx.strokeStyle = "green";
                }
                else if (color % 4 == 3) {
                    ctx.strokeStyle = "yellow";
                }
                
                ctx.beginPath();
                ctx.moveTo(prevX, prevPrice);
                ctx.lineTo(x, price);
                ctx.stroke();
            }
            
        });


        // draw vertical lines
        verticalLines.forEach(line => {
            
            ctx.beginPath();
            ctx.moveTo(line, 0);
            ctx.lineTo(line, canvas.height);
            ctx.strokeStyle = "black";
            ctx.linewidth = 2;
            ctx.stroke();
        })
    }



    // draw graph
    useEffect(() => { 
        // console.log("detected a change in dataPoints");
        drawGraph();
    }, [verticalLines, dataPoints]);


    function handleCanvasClick(event) { 
        if (mode == "Split") { 
            addVeriticalLine(event);
        }
        else if (mode == "Edit") { 
            // function to detect id
            const id = getClickedId(event);
            // function to set ids with correct color
            updateColorById(id);
        }
    }


    function toggleMode() { 
        if (mode == "Split") { 
            setMode("Edit");
        }
        else { 
            setMode("Split");
        }

        

    }


    function test() {
        // dataFromCsv.forEach((point, index) => { 
        //     console.log(point, index);
        // })
        console.log(dataFromCsv['dataFromCsv']);
    }


    return (
        <>
            <p>{mode == "Split" ? "Segment Mode" : "Label Mode"}</p>
            <canvas id="graph" ref={canvasRef} onClick={handleCanvasClick} width="1600" height="600"></canvas>
            <button onClick={toggleMode}>Toggle Mode</button>
            {/* <button onClick={test}>Test</button> */}
        </>
    )
}

export default Graph;








/*


Ok Here's what the fuck is happening. 

So right now the lines get drawn but aren't stored anywhere. 

I need the data array to contain three items per point: 
    - price
    - id
    - class

so the array should look like: 

    [[58, 0, 1], [50, 0, 1], [60, 1, 3]]

Price should be generated randomly for now. 
Id will be unique for each section bounded by vertical lines
Class will be generated randomly for now 0-k


*/