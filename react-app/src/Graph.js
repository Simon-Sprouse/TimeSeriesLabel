import { useState, useEffect, useRef } from 'react'

function Graph(dataFromCsv) { 

    // Variables
    const canvasRef = useRef(null);
    const [mode, setMode] = useState("Split");
    const [verticalLines, setVerticalLines] = useState([]);
    const initialData = Array.from({length: 300}, () => [0, 0, 0])
    const [dataPoints, setDataPoints] = useState(initialData);

    const [numPoints, setNumPoints] = useState(200);
    const [scrollOffset, setScrollOffset] = useState(0);

    // Load data from prop
    useEffect(() => { 
        const adjustedData = dataFromCsv['dataFromCsv'];
        setDataPoints(adjustedData);
    }, [dataFromCsv]);



    /*
    ------------------------
            Edit Mode
    ------------------------
    */

    function getClickedId(event) { 
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const x_step = canvas.width / (numPoints - 1);
        const index = Math.floor(x / x_step) + scrollOffset;
        const pointId = dataPoints[index][1];

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

    /*
    ------------------------
           Segment Mode
    ------------------------
    */


    function addVeriticalLine(event) { 
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        
        const x_step = canvas.width / (numPoints - 1);
        const index = (x / x_step) + scrollOffset; // floating point 



        setVerticalLines(prevLines => {
            const newLines = [...prevLines, index].sort((a, b) => a - b);
            updatePointIds(newLines);
            return newLines;
        });

    }

    // huge performance update needed
    function updatePointIds(verticalLines) { 


        const updatedPoints = dataPoints.map((point, index) => { 

            let newId = 0;

            for (let i = 0; i < verticalLines.length; i++) {
                if (index >= verticalLines[i]) { 
                    newId = i + 1;
                }
                else { 
                    break;
                }
            }

            return [point[0], newId, point[2]];
        });


        setDataPoints(updatedPoints);

    }

    /*
    ------------------------
            Rendering
    ------------------------
    */


    function getMinMaxPrices() { 
        const prices = dataPoints.slice(scrollOffset, scrollOffset + numPoints).map(point => point[0]);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        return { minPrice, maxPrice };
    }


    function drawGraph() {

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 3;

        const x_step = canvas.width / (numPoints - 1);

        const visibleDataPoints = dataPoints.slice(scrollOffset, scrollOffset + numPoints);
        const prices = visibleDataPoints.map(point => point[0]);

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        const margin = 0.1; // 10% margin on both sides
        const usableHeight = canvas.height * (1 - (2 * margin));
        const topMargin = canvas.height * margin;

        const priceRange = maxPrice - minPrice;
        const scaleY = usableHeight / priceRange;



        // draw datapoints graph
        visibleDataPoints.forEach((point, index) => { 


            if (index > 0) { 

                const price = point[0];
                const prevPoint = dataPoints[scrollOffset + index - 1];
                const prevPrice = prevPoint[0];


                const x = index * x_step;
                const y = topMargin + usableHeight - (price - minPrice) * scaleY
                
                const prevX = (index - 1) * x_step;
                const prevY = topMargin + usableHeight - (prevPrice - minPrice) * scaleY;


                const color = point[2];

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
                    ctx.strokeStyle = "orange";
                }
                
                ctx.beginPath();
                ctx.moveTo(prevX, prevY);
                ctx.lineTo(x, y);
                ctx.stroke();
            }
            
        });


        // draw vertical lines
        verticalLines.forEach(lineIndex => {

            const lineX = (lineIndex - scrollOffset) * x_step;
            
            ctx.beginPath();
            ctx.moveTo(lineX, 0);
            ctx.lineTo(lineX, canvas.height);
            ctx.strokeStyle = "black";
            ctx.linewidth = 2;
            ctx.stroke();
        })
    }


    // draw graph
    useEffect(() => { 
        // console.log("detected a change in dataPoints");
        drawGraph();
    }, [verticalLines, dataPoints, scrollOffset]);


    /*
    ------------------------
                UX
    ------------------------
    */

    useEffect(() => { 

        function handleKeyDown(event) { 
            if (event.key == "Enter") { 
                toggleMode();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        }

    })


    function handleCanvasClick(event) { 
        if (mode == "Split") { 
            addVeriticalLine(event);
        }
        else if (mode == "Edit") { 
            const id = getClickedId(event);
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




    function handleScroll(direction) { 
        setScrollOffset((prevOffset) => { 
            const maxOffset = dataPoints.length - numPoints;
            if (direction == "left" && prevOffset >= 10) { 
                return prevOffset - 10;
            }
            else if (direction == "right" && prevOffset < maxOffset - 10) { 
                return prevOffset + 10;
            }
            
            return prevOffset;
        })
        
    }


    function test() {
        console.log(getMinMaxPrices());
    }




    return (
        <>
            <p>{mode == "Split" ? "Segment Mode" : "Label Mode"}</p>
            <canvas id="graph" ref={canvasRef} onClick={handleCanvasClick} width="1600" height="600"></canvas>
            <button onClick={toggleMode}>Toggle Mode</button>
            <button onClick={test}>Test</button>
            <button onClick={() => handleScroll("left")}>Left</button>
            <button onClick={() => handleScroll("right")}>Right</button>
            <p>{scrollOffset}</p>
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





Ok here's what the fuck is happening pt. 2: 

List of things to do: 

- Make the data scale to the window size vertically
- Performance improvement for the updatePointIds function
- Zoom feature to change numPoints
- Create toggle menu
- Add remove segment feature
- Add drag scroll feature
- Zoom with mouse rather than button
- Output the dataset to csv
- Clean csv inputs if they arrive in bad form
- File opener io
- K class selection
- User inputs labels
- Show stats on labels as percentage of data
- Add dates/labels for axes
- Add color underneath line
- Segment darkens when hovering over it
- Css improvements


*/