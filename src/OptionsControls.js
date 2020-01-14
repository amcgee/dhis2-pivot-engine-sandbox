import React from 'react'
import { Checkbox } from '@dhis2/ui-core'

export const OptionsControls = ({ options, setOptions }) => {
    const updateOptionCallbacks = Object.keys(options).reduce((out, key) => {
        out[key] = value => setOptions({
            ...options,
            [key]: value.checked
        })
        return out
    }, {})

    return <div className="optionsContainer">
        <style jsx>{`
            .optionsContainer {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: flex-end;
            }
            .spacer {
                width: 16px;
            }
            .item {
                margin: 0px 4px;
            }
        `}</style>
        <div className="item"><Checkbox dense label="Hide empty rows" checked={options.hideEmptyRows} onChange={updateOptionCallbacks.hideEmptyRows}/></div>
        <div className="item"><Checkbox dense label="Hide empty columns" checked={options.hideEmptyColumns} onChange={updateOptionCallbacks.hideEmptyColumns}/></div>
        <div className="spacer"></div>
        <div className="item"><Checkbox dense label="Show row subtotals" checked={options.showRowSubtotals} onChange={updateOptionCallbacks.showRowSubtotals}/></div>
        <div className="item"><Checkbox dense label="Show column subtotals" checked={options.showColumnSubtotals} onChange={updateOptionCallbacks.showColumnSubtotals}/></div>
        <div className="spacer"></div>
        <div className="item"><Checkbox dense label="Show row totals" checked={options.showRowTotals} onChange={updateOptionCallbacks.showRowTotals}/></div>
        <div className="item"><Checkbox dense label="Show column totals" checked={options.showColumnTotals} onChange={updateOptionCallbacks.showColumnTotals}/></div>
    </div>
}