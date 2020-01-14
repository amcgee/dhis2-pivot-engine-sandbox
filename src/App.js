import React, { useState, useEffect } from 'react'
import { PivotTable } from './engine'
import { CircularLoader } from '@dhis2/ui-core'
import { OptionsControls } from './OptionsControls'
import { VisualizationPicker } from './VisualizationPicker'

const visualizationOptions = ['test', 'deep', 'emptyRows', 'emptyColumns']

const loadVisualization = (name) => {
    return Promise.all([
        import(`./data/${name}.visualization.json`),
        import(`./data/${name}.data.json`)
    ]).then(([visualization, data]) => ({
        name,
        data,
        visualization
    }))
}
const defaultOptions = {
    hideEmptyRows: false,
    hideEmptyColumns: false,
    showColumnSubtotals: false,
    showRowSubtotals: false,
    showColumnTotals: false,
    showRowTotals: false,
}

const MyApp = () => {
    const [loadedVisualization, setLoadedVisualization] = useState(null)
    const [visualizationName, setVisualizationName] = useState(visualizationOptions[0])
    const [options, setOptions] = useState(defaultOptions)

    useEffect(() => {
        setLoadedVisualization(null)
        loadVisualization(visualizationName)
            .then(setLoadedVisualization)
    }, [visualizationName])
    
    return <div className="container">
        <style jsx>{`
            .container {
                position: absolute;
                top: 48px;
                bottom: 0px;
                left: 0px;
                right: 0px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
            }
            .options {
                display: flex;
                flex-direction: row;
                width: 1200px;
                padding: 8px;
            }
            .table {
                width: 1200px;
                height: 600px;
            }
        }`}</style>
        <div className="options">
            <VisualizationPicker visualization={visualizationName} setVisualization={setVisualizationName} options={visualizationOptions} />
            <OptionsControls options={options} setOptions={setOptions} />
        </div>
        <div className="table">
            {!loadedVisualization
                ? <CircularLoader />
                : <PivotTable visualization={loadedVisualization.visualization} data={loadedVisualization.data} options={options} />
            }
        </div>
    </div>
}

export default MyApp
