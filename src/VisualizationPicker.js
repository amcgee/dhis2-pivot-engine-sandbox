import React from 'react'
import { SingleSelect, SingleSelectOption } from '@dhis2/ui-core'
export const VisualizationPicker = ({ visualization, setVisualization, options }) => (
    <div style={{ width: 150 }}>
    <SingleSelect
        className="select"
        selected={{
            label: visualization,
            value: visualization
        }}
        onChange={({ selected }) => setVisualization(selected.value)}
    >
        {options.map(option => 
            <SingleSelectOption
                key={option}
                label={option}
                value={option}
            />
        )}
    </SingleSelect>
    </div>
)