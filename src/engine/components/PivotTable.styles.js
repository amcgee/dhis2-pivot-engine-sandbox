import css from 'styled-jsx/css'

export default css`
    div.pivot-table-container {
        max-width: 1200px;
        height: 600px;
        overflow: auto;
        border: 1px solid #b2b2b2;
    }
    div.pivot-table-container::-webkit-scrollbar {
        -webkit-appearance: none;
    }

    div.pivot-table-container::-webkit-scrollbar-vertical {
        width: 8px;
    }

    div.pivot-table-container::-webkit-scrollbar-horizontal {
        height: 8px;
    }

    div.pivot-table-container::-webkit-scrollbar-thumb {
        border-radius: 8px;
        border: 1px solid white; /* should match background, can't be transparent */
        background-color: rgba(0, 0, 0, .5);
    }
    table {
        position: relative;
        border-spacing: 0;
        border-collapse: collapse;
        white-space: nowrap;
        box-sizing: border-box;
        text-align: center;
    }
    tr:first-child > th {
        border-top: 0;
    }
    tr:last-child > td {
        border-bottom: 0;
    }
    tr > td:last-child, tr > th:last-child {
        border-right: 0;
    }
    td, th {
        padding: 8px;
        border: 1px solid #b2b2b2;
        min-width: 150px;
        /* max-width: 150px; */
        min-height: 25px;
        /* max-height: 25px; */
    }
    th {
        font-weight: normal;
        position: sticky;
        top: 0;
        z-index: 1;
        background-color: #dae6f8;
    }
    th.row-header {
        z-index: 2 !important;
    }
    td.row-header, th.row-header {
        position: sticky;
        left: 0;
        z-index: 1;
        border-left: 0;
        background-color: #dae6f8;
    }
    td.row-header {
        padding: 0;
    }
    td.row-header tr:first-child td {
        border-left: 0;
        border-top: 0;
    }
    td.row-header tr:first-child td:first-child {
        border-bottom: 0;
    }
    td.empty-header, th.empty-header {
        background-color: #cddaed;
    }
    td.total-header {
        background-color: #bac6d8;
    }
    .subtotal {
        background-color: #f4f4f4;
    }
    .total {
        background-color: #d8d8d8;
    }
`