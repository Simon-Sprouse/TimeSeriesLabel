import { useState, useEffect, useRef } from 'react'

function Graph(dataFromCsv) { 

    // Variables
    const canvasRef = useRef(null);
    const [tool, setTool] = useState("Segment"); // segment, erase, color, drag
    const [verticalLines, setVerticalLines] = useState([]);
    const initialData = Array.from({length: 300}, () => [0, 0, 0])
    const [dataPoints, setDataPoints] = useState(initialData);

    const [numPoints, setNumPoints] = useState(200);
    const [scrollOffset, setScrollOffset] = useState(0);

    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragStartOffset, setDragStartOffset] = useState(0);

    const [showVerticalLines, setShowVerticalLines] = useState(true);

    // Load data from prop
    useEffect(() => { 
        const adjustedData = dataFromCsv['dataFromCsv'];
        setDataPoints(adjustedData);
    }, [dataFromCsv]);



    /*
    ------------------------
            Color Mode
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

    function removeVerticalLine(event) { 
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;


        const x_step = canvas.width / (numPoints -  1);
        const clickIndex = (x / x_step) + scrollOffset;
        const threshold = numPoints / 50; // TODO: calculate this dynamically

        let closestLineIndex = -1;
        let minDistance = Infinity;


        verticalLines.forEach((line, index) => { 
            const distance = Math.abs(line - clickIndex);
            if (distance < minDistance) {
                minDistance = distance;
                closestLineIndex = index;

            }
        });

        if (minDistance < threshold) {
            setVerticalLines(prevLines => { 

                const newLines = [...prevLines];
                const removedLine = newLines.splice(closestLineIndex, 1)[0];

                // console.log(removedLine);



                const leftPoint = dataPoints[Math.floor(removedLine)];
                const leftId = leftPoint[1];
                const leftColor = leftPoint[2];

                // console.log(leftColor);


                mergePointIds(newLines, leftId, leftColor);

                

                return newLines;
            })
        }





    }


    function updatePointIds(verticalLines) { 

        let id = 0;

        const updatedPoints = dataPoints.map((point, index) => { 

            // if point is further right than vertical line, create new id group
            while (index >= verticalLines[id]) { 
                id++;
            }

            return [point[0], id, point[2]];
        });

        setDataPoints(updatedPoints);

    }

    function mergePointIds(verticalLines, leftId, leftColor) {

        let id = 0;

        const updatedPoints = dataPoints.map((point, index) => { 

            // if point is further right than vertical line, create new id group
            while (index >= verticalLines[id]) { 
                id++;
            }

            if (point[1] == leftId + 1) { 
                return [point[0], id, leftColor];
            }

            return [point[0], id, point[2]];
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
        if (showVerticalLines == true) {
            verticalLines.forEach(lineIndex => {

                const lineX = (lineIndex - scrollOffset) * x_step;
                
                ctx.beginPath();
                ctx.moveTo(lineX, 0);
                ctx.lineTo(lineX, canvas.height);
                ctx.strokeStyle = "black";
                ctx.linewidth = 2;
                ctx.stroke();
            });
        }
        
    }


    // draw graph
    useEffect(() => { 
        // console.log("detected a change in dataPoints");
        drawGraph();
    }, [verticalLines, dataPoints, scrollOffset, numPoints, showVerticalLines]);

    /*
    ------------------------
            Drag Scroll
    ------------------------
    */

    function handleMouseDown(event) { 

        if (tool == "Drag") { 

            setIsDragging(true);
            setDragStartX(event.clientX);
            setDragStartOffset(scrollOffset);
        }
    }

    function handleMouseUp() { 
        if (isDragging) { 
            setIsDragging(false);
        }
    }

    function handleMouseMove(event) { 


        if (isDragging) { 
            const canvas = canvasRef.current;
            const dragDistance = event.clientX - dragStartX;
            const x_step = canvas.width / (numPoints - 1);

            const newOffset = dragStartOffset - Math.floor(dragDistance / x_step);
            const maxOffset = dataPoints.length - numPoints;
   

            const clampedOffset = Math.max(0, Math.min(newOffset, maxOffset));
            setScrollOffset(clampedOffset);
        }
    }

    function handleMouseLeave() { 
        handleMouseUp();
    }




    useEffect(() => {

        const canvas = canvasRef.current;
        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mouseup", handleMouseUp);
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);

        return () => { 
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mouseup", handleMouseUp);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
        }
    }, [isDragging, dragStartX, dragStartOffset, scrollOffset, numPoints, tool]);



    /*
    ------------------------
           Wheel Zoom
    ------------------------
    */


    function handleWheel(event) { 

        event.preventDefault();
        
        const zoomDirection = event.deltaY > 0 ? "out" : "in";
        const zoomFactor = 2; // to be applied on both ends

        if (zoomDirection == "out") { 
            setNumPoints(prevNumPoints => { 
                const newNumPoints = Math.min(prevNumPoints + zoomFactor * 2, dataPoints.length);
                setScrollOffset(prevOffset => { 
                    return Math.max(prevOffset - zoomFactor, 0);
                })
                return newNumPoints;
            });
        }
        else if (zoomDirection == "in") {
            setNumPoints(prevNumPoints => { 
                const newNumPoints = Math.max(prevNumPoints - zoomFactor * 2, 2);
                setScrollOffset(prevOffset => { 
                    return Math.min(prevOffset + zoomFactor, dataPoints.length);
                })
                return newNumPoints;
            });
        }

    }



    useEffect(() => { 
        const canvas = canvasRef.current;
        canvas.addEventListener("wheel", handleWheel);

        return () => { 
            canvas.removeEventListener("wheel", handleWheel);
        }
    }, [numPoints, scrollOffset, dataPoints]);


    /*
    ------------------------
                UX
    ------------------------
    */

    useEffect(() => { 

        function handleKeyDown(event) { 
            if (tool == "Segment") { 
                setTool("Color");
            }
            else if (tool == "Color") { 
                setTool("Erase");
            }
            else if (tool == "Erase") { 
                setTool("Drag");
            }
            else if (tool == "Drag") { 
                setTool("Segment");
            }
           
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        }

    })


    function handleCanvasClick(event) { 


        if (tool == "Segment") { 
            addVeriticalLine(event);
        }
        else if (tool == "Color") { 
            const id = getClickedId(event);
            updateColorById(id);
        }
        else if (tool == "Erase") { 
            removeVerticalLine(event);
        }
    }

    function exportData() { 

        const colorToKClass = dataPoints.map(row => [row[0], [row[1], row[2] % 4]]);

        const headers = ["Price", "Id", "Class"];
        let csvData = headers.join(", ") + "\n";

        colorToKClass.forEach(point => { 
            csvData += point.join(", ") + "\n";
        });


        const blob = new Blob([csvData], {type: "text/csv"});
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "dataPoints.csv";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }




    function test() {
        console.log(dataPoints);
    }

    


    return (
        <>
            <div className="tool-menu">

                <div className={`tab ${tool == "Segment" ? "active" : ""}`} 
                    onClick={() => setTool("Segment")}>Segment</div>
                <div className={`tab ${tool == "Color" ? "active" : ""}`}  
                    onClick={() => setTool("Color")}>Color</div>
                <div className={`tab ${tool == "Erase" ? "active" : ""}`} 
                    onClick={() => setTool("Erase")}>Erase</div>
                <div className={`tab ${tool == "Drag" ? "active" : ""}`} 
                    onClick={() => setTool("Drag")}>Drag</div>

            </div>
            <canvas id="graph" ref={canvasRef} onClick={handleCanvasClick} width="1600" height="600"></canvas>
            <button onClick={test}>Test</button>
            <button onClick={() => {setShowVerticalLines(!showVerticalLines);}}>{showVerticalLines == true ? "Hide" : "Show"} Vertical Lines</button>
            <button onClick={exportData}>Export Data</button>
        
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

- Make the data scale to the window size vertically         DONE
- Performance improvement for the updatePointIds function   DONE
- Zoom feature to change numPoints                          DONE
- Create toggle menu                                        DONE
- Add remove segment feature                                DONE
- Add drag scroll feature                                   DONE
- Zoom with mouse rather than button                        DONE
- Option to remove all vertical bars                        DONE
- Output the dataset to csv                                 DONE
- Clean csv inputs if they arrive in bad form
- File opener io
- K class selection
- User inputs labels
- Show stats on labels as percentage of data
- Graph all members overlayed
- Add dates/labels for axes
- Add color underneath line
- Segment darkens when hovering over it
- Css improvements
- Change cursor style based on tool mode
- Show text on graph for labels
- Add tracking (annotate) tool
- Drag for erase feature
- Reset option
- Better zoom logic



*/