const $ = id => document.getElementById(id);

const state = {
    page: 1,
    size: 500,
    search: "",
    category: "",
    scanResults: [],
    sortColumn: null,
    sortDirection: "desc",
    scanning: false,
    scanned: 0,
    total: 0
};


// ============================================================
// HELPERS
// ============================================================

function el(...ids) {
    for (const id of ids) {
        const node = $(id);
        if (node) return node;
    }
    return null;
}


function money(v) {

    if (
        v === null ||
        v === undefined ||
        v === ""
    ) {
        return "-";
    }

    return Number(v).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function esc(v) {

    return String(v ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function toast(message) {

    const t = $("toast");

    if (!t) return;

    t.textContent = message;

    t.classList.add("show");

    clearTimeout(
        window.__toastTimer
    );

    window.__toastTimer =
        setTimeout(
            () => {
                t.classList.remove("show");
            },
            3000
        );
}


// ============================================================
// LOAD CATEGORIES
// ============================================================

async function categories() {

    const response =
        await fetch(
            "/api/categories"
        );

    const data =
        await response.json();

    const select =
        el("category");

    if (!select) return;

    select.innerHTML =
        '<option value="">All Categories</option>';

    (
        data.categories || []
    ).forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                category;

            option.textContent =
                category;

            select.appendChild(
                option
            );
        }
    );

    select.value =
        state.category;
}


// ============================================================
// RESET SUMMARY CARDS
// ============================================================

function resetCards() {

    const breakouts =
        el(
            "breakouts",
            "breakoutCount"
        );

    const scanned =
        el(
            "scanned",
            "scannedCount"
        );

    const avg =
        el(
            "avg",
            "avgGain"
        );

    const top =
        el(
            "top",
            "topGainer"
        );


    if (breakouts) {

        breakouts.textContent =
            "0";
    }

    if (scanned) {

        scanned.textContent =
            "0";
    }

    if (avg) {

        avg.textContent =
            "0.00%";
    }

    if (top) {

        top.textContent =
            "-";
    }


    state.scanned = 0;
}


// ============================================================
// UPDATE SUMMARY CARDS
// ============================================================

function updateCards() {

    const breakouts =
        el(
            "breakouts",
            "breakoutCount"
        );

    const scanned =
        el(
            "scanned",
            "scannedCount"
        );

    const avg =
        el(
            "avg",
            "avgGain"
        );

    const top =
        el(
            "top",
            "topGainer"
        );


    // --------------------------------------------------------
    // BREAKOUT STOCKS
    // --------------------------------------------------------

    if (breakouts) {

        breakouts.textContent =
            String(
                state.scanResults.length
            );
    }


    // --------------------------------------------------------
    // STOCKS SCANNED
    // --------------------------------------------------------

    if (scanned) {

        scanned.textContent =
            String(
                state.scanned
            );
    }


    // --------------------------------------------------------
    // NO BREAKOUTS
    // --------------------------------------------------------

    if (
        !state.scanResults.length
    ) {

        if (avg) {

            avg.textContent =
                "0.00%";
        }

        if (top) {

            top.textContent =
                "-";
        }

        return;
    }


    // --------------------------------------------------------
    // AVERAGE GAIN
    // --------------------------------------------------------

    const totalGain =
        state.scanResults.reduce(
            (
                sum,
                stock
            ) => {

                return (
                    sum +
                    Number(
                        stock.percent_diff || 0
                    )
                );

            },
            0
        );


    const average =
        totalGain /
        state.scanResults.length;


    if (avg) {

        avg.textContent =
            average.toFixed(2)
            + "%";
    }


    // --------------------------------------------------------
    // TOP GAINER
    // --------------------------------------------------------

    const topStock =
        [
            ...state.scanResults
        ].sort(
            (
                a,
                b
            ) => {

                return (
                    Number(
                        b.percent_diff || 0
                    )
                    -
                    Number(
                        a.percent_diff || 0
                    )
                );

            }
        )[0];


    if (top) {

        top.textContent =
            `${topStock.symbol} (+${Number(
                topStock.percent_diff || 0
            ).toFixed(2)}%)`;
    }
}


// ============================================================
// TABLE BODY
// ============================================================

function tableBody() {

    return el(
        "rows",
        "stockTableBody"
    );
}


// ============================================================
// CLEAR TABLE
// ============================================================

function clearTable() {

    const body =
        tableBody();

    if (body) {

        body.innerHTML =
            "";
    }
}


// ============================================================
// DATE PARSER
// ============================================================

function parseDateValue(value) {

    if (!value) {

        return -Infinity;
    }


    const parts =
        String(value).split("-");


    // DD-MM-YYYY
    if (
        parts.length === 3 &&
        parts[0].length <= 2
    ) {

        return new Date(
            `${parts[2]}-${parts[1]}-${parts[0]}`
        ).getTime();
    }


    const timestamp =
        new Date(
            value
        ).getTime();


    return Number.isNaN(
        timestamp
    )
        ? -Infinity
        : timestamp;
}


// ============================================================
// RENDER SCAN TABLE
// ============================================================

function renderTable() {

    const body = tableBody();

    if (!body) return;

    // Clear desktop table
    body.innerHTML = "";

    // Clear mobile cards
    const mobileList =
        document.getElementById("mobileStockList");

    if (mobileList) {
        mobileList.innerHTML = "";
    }

    // --------------------------------------------------------
    // COPY RESULTS
    // --------------------------------------------------------

    const sorted = [
        ...state.scanResults
    ];

    // --------------------------------------------------------
    // SORT
    // --------------------------------------------------------

    if (state.sortColumn) {

        sorted.sort((a, b) => {

            let av =
                a[state.sortColumn];

            let bv =
                b[state.sortColumn];

            // % Difference
            if (
                state.sortColumn ===
                "percent_diff"
            ) {

                av = Number(
                    av ?? -Infinity
                );

                bv = Number(
                    bv ?? -Infinity
                );
            }

            // Date
            else if (
                state.sortColumn ===
                "date"
            ) {

                av =
                    parseDateValue(av);

                bv =
                    parseDateValue(bv);
            }

            if (av < bv) {

                return (
                    state.sortDirection ===
                    "asc"
                )
                    ? -1
                    : 1;
            }

            if (av > bv) {

                return (
                    state.sortDirection ===
                    "asc"
                )
                    ? 1
                    : -1;
            }

            return 0;
        });
    }


    // ========================================================
    // DESKTOP TABLE
    // ========================================================

    sorted.forEach(stock => {

        const diff =
            Number(
                stock.percent_diff || 0
            );

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>
                ${esc(stock.date)}
            </td>

            <td class="symbol">
                ${esc(stock.symbol)}
            </td>

            <td>
                ${esc(stock.stock_name)}
            </td>

            <td>
                ${esc(stock.exchange)}
            </td>

            <td>
                ₹${money(stock.breakout_level)}
            </td>

            <td>
                ₹${money(stock.stoploss)}
            </td>

            <td>
                ₹${money(stock.current_price)}
            </td>

            <td class="green">
                ▲ ${diff.toFixed(2)}%
            </td>

            <td>
                ${esc(stock.youtuber)}
            </td>

            <td>
                ${esc(stock.advisor)}
            </td>

            <td>
                ${esc(stock.category)}
            </td>

            <td>
                <span class="pill">
                    ⚡ YES
                </span>
            </td>

        `;

        body.appendChild(row);
    });


    // ========================================================
    // MOBILE STOCK CARDS
    // ========================================================

    if (!mobileList) {
        return;
    }

    sorted.forEach(stock => {

        const diff =
            Number(
                stock.percent_diff || 0
            );

        const card =
            document.createElement("div");

        card.className =
            "mobile-stock-card";


        card.innerHTML = `

            <!-- TOP -->
            <div class="mobile-card-top">

                <div class="mobile-symbol">
                    ${esc(stock.symbol)}
                </div>

                <span class="mobile-breakout-badge">
                    ⚡ BREAKOUT
                </span>

            </div>


            <!-- EXCHANGE -->
            <div class="mobile-exchange">
                ${esc(stock.exchange)}
            </div>


            <!-- STOCK NAME -->
            <div class="mobile-stock-name">
                ${esc(stock.stock_name)}
            </div>


            <div class="mobile-divider"></div>


            <!-- DATE / DIFF -->
            <div class="mobile-info-row">

                <div class="mobile-info">

                    <span class="mobile-label">
                        DATE
                    </span>

                    <span class="mobile-value">
                        ${esc(stock.date)}
                    </span>

                </div>


                <div class="mobile-info mobile-right">

                    <span class="mobile-label">
                        % DIFF
                    </span>

                    <span class="mobile-value mobile-green">

                        ▲ ${diff.toFixed(2)}%

                    </span>

                </div>

            </div>


            <!-- PRICES -->
            <div class="mobile-price-row">

                <div class="mobile-price">

                    <span class="mobile-label">
                        BREAKOUT
                    </span>

                    <span class="mobile-price-value">
                        ₹${money(
                            stock.breakout_level
                        )}
                    </span>

                </div>


                <div class="mobile-price">

                    <span class="mobile-label">
                        STOPLOSS
                    </span>

                    <span class="mobile-price-value">

                        ${
                            stock.stoploss == null
                                ? "—"
                                : "₹" +
                                  money(
                                      stock.stoploss
                                  )
                        }

                    </span>

                </div>


                <div class="mobile-price">

                    <span class="mobile-label">
                        CURRENT
                    </span>

                    <span class="mobile-price-value mobile-green">

                        ${
                            stock.current_price == null
                                ? "—"
                                : "₹" +
                                  money(
                                      stock.current_price
                                  )
                        }

                    </span>

                </div>

            </div>

        `;

        mobileList.appendChild(card);

    });

}

// ============================================================
// SORT
// ============================================================

function sortScanResults(
    column
) {

    if (
        state.sortColumn ===
        column
    ) {

        state.sortDirection =
            state.sortDirection ===
            "asc"
                ? "desc"
                : "asc";

    } else {

        state.sortColumn =
            column;

        state.sortDirection =
            "desc";
    }


    renderTable();

    updateSortIcons();
}


// ============================================================
// SORT ICONS
// ============================================================

function updateSortIcons() {

    const date =
        $("dateSort");

    const percent =
        $("percentSort");


    if (date) {

        date.textContent =
            state.sortColumn ===
            "date"

                ? (
                    state.sortDirection ===
                    "asc"
                        ? "↑"
                        : "↓"
                )

                : "↕";
    }


    if (percent) {

        percent.textContent =
            state.sortColumn ===
            "percent_diff"

                ? (
                    state.sortDirection ===
                    "asc"
                        ? "↑"
                        : "↓"
                )

                : "↕";
    }
}


// ============================================================
// PROGRESS
// ============================================================

function updateProgress(
    index,
    total
) {

    state.total =
        total;


    const progress =
        el(
            "scanProgress"
        );


    if (progress) {

        progress.textContent =
            `Scanning ${index} / ${total}`;
    }
}


// ============================================================
// ADD BREAKOUT RESULT
//
// ONLY STATUS = YES
// ============================================================

function addBreakoutResult(
    stock
) {

    // --------------------------------------------------------
    // Ignore everything except YES
    // --------------------------------------------------------

    if (
        stock.status !==
        "YES"
    ) {

        return;
    }


    // --------------------------------------------------------
    // Ignore missing prices
    // --------------------------------------------------------

    if (
        stock.current_price ===
        null ||

        stock.current_price ===
        undefined
    ) {

        return;
    }


    // --------------------------------------------------------
    // Ignore missing percentage
    // --------------------------------------------------------

    if (
        stock.percent_diff ===
        null ||

        stock.percent_diff ===
        undefined
    ) {

        return;
    }


    // --------------------------------------------------------
    // Check if already exists
    // --------------------------------------------------------

    const existing =
        state.scanResults.findIndex(
            x =>
                x.id ===
                stock.id
        );


    // --------------------------------------------------------
    // UPDATE
    // --------------------------------------------------------

    if (
        existing >= 0
    ) {

        state.scanResults[
            existing
        ] = stock;

    }


    // --------------------------------------------------------
    // ADD
    // --------------------------------------------------------

    else {

        state.scanResults.push(
            stock
        );
    }


    // --------------------------------------------------------
    // IMMEDIATELY UPDATE UI
    // --------------------------------------------------------

    renderTable();

    updateCards();
}


// ============================================================
// FINISH SCAN
// ============================================================

function finishScan(
    button,
    source
) {

    state.scanning =
        false;


    if (button) {

        button.disabled =
            false;

        button.textContent =
            "↻ Run Scan";
    }


    if (source) {

        source.close();
    }


    updateCards();
}


// ============================================================
// RUN SCAN
// ============================================================

function runScan() {

    if (
        state.scanning
    ) {

        return;
    }


    const button =
        el(
            "scan",
            "scanButton"
        );


    // --------------------------------------------------------
    // START NEW SCAN
    // --------------------------------------------------------

    state.scanning =
        true;

    state.scanResults =
        [];

    state.sortColumn =
        null;

    state.sortDirection =
        "desc";


    // --------------------------------------------------------
    // CLEAR TABLE IMMEDIATELY
    // --------------------------------------------------------

    clearTable();


    // --------------------------------------------------------
    // RESET CARDS
    // --------------------------------------------------------

    resetCards();


    updateSortIcons();


    // --------------------------------------------------------
    // BUTTON
    // --------------------------------------------------------

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Scanning...";
    }


    // --------------------------------------------------------
    // STREAM URL
    // --------------------------------------------------------

    const url =
        "/api/run-scan-stream?category="
        +
        encodeURIComponent(
            state.category
        );


    const source =
        new EventSource(
            url
        );


    window.__scanSource =
        source;


    // ========================================================
    // RECEIVE STREAM DATA
    // ========================================================

    source.onmessage =
        event => {

            let data;


            try {

                data =
                    JSON.parse(
                        event.data
                    );

            } catch (error) {

                console.error(
                    "Invalid scan event",
                    error
                );

                return;
            }


            // ------------------------------------------------
            // START
            // ------------------------------------------------

            if (
                data.type ===
                "start"
            ) {

                updateProgress(
                    0,
                    data.total
                );

                return;
            }


            // ------------------------------------------------
            // ONE STOCK
            // ------------------------------------------------

            if (
                data.type ===
                "stock"
            ) {

                // --------------------------------------------
                // Update scanned count
                // --------------------------------------------

                state.scanned =
                    Number(
                        data.summary?.scanned
                        ||
                        state.scanned
                    );


                // --------------------------------------------
                // Progress
                // --------------------------------------------

                updateProgress(
                    data.index,
                    data.total
                );


                // --------------------------------------------
                // ONLY YES GETS DISPLAYED
                // --------------------------------------------

                addBreakoutResult(
                    data.result
                );


                // --------------------------------------------
                // Cards
                // --------------------------------------------

                updateCards();

                return;
            }


            // ------------------------------------------------
            // COMPLETE
            // ------------------------------------------------

            if (
                data.type ===
                "complete"
            ) {

                state.scanned =
                    Number(
                        data.summary?.scanned
                        ||
                        state.scanned
                    );


                updateCards();


                finishScan(
                    button,
                    source
                );


                toast(
                    `${
                        data.summary?.breakouts
                        || 0
                    } breakout stocks found`
                );


                return;
            }
        };


    // ========================================================
    // STREAM ERROR
    // ========================================================

    source.onerror =
        error => {

            console.error(
                "Scan stream error:",
                error
            );


            finishScan(
                button,
                source
            );


            toast(
                "Scan connection ended. Check the Flask console for errors."
            );
        };
}


// ============================================================
// LOAD MASTER TABLE
// ============================================================

async function loadMasterTable() {

    const params =
        new URLSearchParams({

            page:
                state.page,

            page_size:
                state.size,

            search:
                state.search,

            category:
                state.category
        });


    const response =
        await fetch(
            "/api/stocks?"
            +
            params
        );


    const data =
        await response.json();


    const body =
        tableBody();


    if (!body) {

        return;
    }


    body.innerHTML =
        "";


    if (
        !data.items?.length
    ) {

        return;
    }


    // --------------------------------------------------------
    // MASTER TABLE
    // --------------------------------------------------------

    data.items.forEach(
        stock => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${esc(
                        stock.date
                    )}
                </td>

                <td class="symbol">
                    ${esc(
                        stock.symbol
                    )}
                </td>

                <td>
                    ${esc(
                        stock.stock_name
                    )}
                </td>

                <td>
                    ${esc(
                        stock.exchange
                    )}
                </td>

                <td>
                    ₹${money(
                        stock.breakout_level
                    )}
                </td>

                <td>
                    ₹${money(
                        stock.stoploss
                    )}
                </td>

                <td>
                    ₹${money(
                        stock.current_price
                    )}
                </td>

                <td class="green">

                    ${
                        stock.percent_diff ==
                        null

                            ? "-"

                            :

                            Number(
                                stock.percent_diff
                            ).toFixed(2)
                            +
                            "%"
                    }

                </td>

                <td>
                    ${esc(
                        stock.youtuber
                    )}
                </td>

                <td>
                    ${esc(
                        stock.advisor
                    )}
                </td>

                <td>
                    ${esc(
                        stock.category
                    )}
                </td>

                <td>

                    <span
                        class="pill watch"
                    >

                        ${esc(
                            stock.status
                            ||
                            "NOT SCANNED"
                        )}

                    </span>

                </td>

            `;


            body.appendChild(
                row
            );
        }
    );
}


// ============================================================
// REFRESH
// ============================================================

async function refresh() {

    await loadMasterTable();
}


// ============================================================
// CATEGORY CHANGE
// ============================================================

const categorySelect =
    $("category");


if (categorySelect) {

    categorySelect.onchange =
        async event => {

            state.category =
                event.target.value;

            state.page =
                1;

            state.scanResults =
                [];

            clearTable();

            resetCards();

            await refresh();
        };
}


// ============================================================
// SEARCH
// ============================================================

const search =
    $("search");


if (search) {

    search.oninput =
        event => {

            clearTimeout(
                window.__searchTimer
            );


            window.__searchTimer =
                setTimeout(
                    async () => {

                        state.search =
                            event.target.value.trim();

                        state.page =
                            1;

                        await refresh();

                    },
                    250
                );
        };
}


// ============================================================
// SCAN BUTTON
// ============================================================

const scanButton =
    el(
        "scan",
        "scanButton"
    );


if (scanButton) {

    scanButton.onclick =
        runScan;
}


// ============================================================
// EXCEL DOWNLOAD
// ============================================================

const excel =
    $("excel");


if (excel) {

    excel.onclick =
        () => {

            location.href =
                "/api/download-excel?category="
                +
                encodeURIComponent(
                    state.category
                );
        };
}


// ============================================================
// DATE SORT HEADER
// ============================================================

const dateHeader =
    $("dateHeader");


if (dateHeader) {

    dateHeader.onclick =
        () => {

            sortScanResults(
                "date"
            );
        };
}


// ============================================================
// % DIFFERENCE SORT HEADER
// ============================================================

const percentHeader =
    $("percentHeader");


if (percentHeader) {

    percentHeader.onclick =
        () => {

            sortScanResults(
                "percent_diff"
            );
        };
}


// ============================================================
// ALTERNATIVE HEADER IDs
// ============================================================

const dateSortHeader =
    $("dateSortHeader");


if (dateSortHeader) {

    dateSortHeader.onclick =
        () => {

            sortScanResults(
                "date"
            );
        };
}


const percentSortHeader =
    $("percentSortHeader");


if (percentSortHeader) {

    percentSortHeader.onclick =
        () => {

            sortScanResults(
                "percent_diff"
            );
        };
}


// ============================================================
// INITIAL LOAD
// ============================================================

(async () => {

    try {

        await categories();

        await refresh();

    } catch (error) {

        console.error(
            error
        );

        toast(
            "Unable to load dashboard"
        );
    }

})();

// ============================================================
// TABLE SORTING
// ============================================================

function sortScanResults(column) {

    if (state.sortColumn === column) {

        // Toggle direction
        state.sortDirection =
            state.sortDirection === "asc"
                ? "desc"
                : "asc";

    } else {

        // First click = descending
        state.sortColumn = column;
        state.sortDirection = "desc";
    }

    renderTable();

    updateSortIcons();
}


// ============================================================
// UPDATE SORT ARROWS
// ============================================================

function updateSortIcons() {

    const dateSort =
        document.getElementById("dateSort");

    const percentSort =
        document.getElementById("percentSort");


    if (dateSort) {

        if (state.sortColumn === "date") {

            dateSort.textContent =
                state.sortDirection === "asc"
                    ? "↑"
                    : "↓";

        } else {

            dateSort.textContent = "↕";
        }
    }


    if (percentSort) {

        if (
            state.sortColumn === "percent_diff"
        ) {

            percentSort.textContent =
                state.sortDirection === "asc"
                    ? "↑"
                    : "↓";

        } else {

            percentSort.textContent = "↕";
        }
    }
}


// ============================================================
// CONNECT DATE HEADER
// ============================================================

function setupSorting() {

    const dateHeader =
        document.getElementById(
            "dateHeader"
        );

    const percentHeader =
        document.getElementById(
            "percentHeader"
        );


    if (dateHeader) {

        dateHeader.onclick =
            function () {

                sortScanResults(
                    "date"
                );
            };
    }


    if (percentHeader) {

        percentHeader.onclick =
            function () {

                sortScanResults(
                    "percent_diff"
                );
            };
    }
}


// ============================================================
// INITIALIZE SORTING
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupSorting();

    }
);


// ============================================================
// ADD / EDIT STOCK
// ============================================================

const modal = document.getElementById("modal");
const form = document.getElementById("form");

const addButton =
    document.getElementById("addStock") ||
    document.getElementById("add") ||
    document.getElementById("addBtn");
    

const closeButton =
    document.getElementById("close");
a

// ------------------------------------------------------------
// OPEN ADD STOCK MODAL
// ------------------------------------------------------------

function openAddStock() {

    if (!modal || !form) return;

    form.reset();

    const id =
        document.getElementById("id");

    if (id) {
        id.value = "";
    }

    const title =
        document.getElementById("formTitle");

    if (title) {
        title.textContent =
            "Add Stock";
    }

    modal.classList.add("show");

    modal.style.display = "flex";
}


// ------------------------------------------------------------
// CLOSE MODAL
// ------------------------------------------------------------

function closeStockModal() {

    if (!modal) return;

    modal.classList.remove("show");

    modal.style.display = "none";
}


// ------------------------------------------------------------
// ADD STOCK BUTTON
// ------------------------------------------------------------

if (addButton) {

    addButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            openAddStock();

        }
    );
}


// ------------------------------------------------------------
// CLOSE BUTTON
// ------------------------------------------------------------

if (closeButton) {

    closeButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            closeStockModal();

        }
    );
}


// ------------------------------------------------------------
// CLICK OUTSIDE MODAL
// ------------------------------------------------------------

if (modal) {

    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === modal
            ) {

                closeStockModal();

            }

        }
    );
}


// ============================================================
// FORM SUBMIT
// ============================================================

if (form) {

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const id =
                document.getElementById(
                    "id"
                )?.value;


            const payload = {

                date:
                    document.getElementById(
                        "date"
                    )?.value,

                symbol:
                    document.getElementById(
                        "symbol"
                    )?.value,

                stock_name:
                    document.getElementById(
                        "stockName"
                    )?.value ||
                    document.getElementById(
                        "stock_name"
                    )?.value,

                exchange:
                    document.getElementById(
                        "exchange"
                    )?.value ||
                    "NSE",

                breakout_level:
                    document.getElementById(
                        "breakoutLevel"
                    )?.value ||
                    document.getElementById(
                        "breakout_level"
                    )?.value,

                stoploss:
                    document.getElementById(
                        "stoploss"
                    )?.value,

                current_price:
                    document.getElementById(
                        "currentPrice"
                    )?.value ||
                    document.getElementById(
                        "current_price"
                    )?.value,

                youtuber:
                    document.getElementById(
                        "youtuber"
                    )?.value,

                advisor:
                    document.getElementById(
                        "advisor"
                    )?.value,

                category:
                    document.getElementById(
                        "categoryForm"
                    )?.value ||
                    document.getElementById(
                        "stockCategory"
                    )?.value ||
                    "Breakouts"
            };


            console.log(
                "Saving stock:",
                payload
            );


            try {

                let url =
                    "/api/stocks";

                let method =
                    "POST";


                // ------------------------------------------------
                // EDIT
                // ------------------------------------------------

                if (id) {

                    url =
                        `/api/stocks/${id}`;

                    method =
                        "PUT";
                }


                const response =
                    await fetch(
                        url,
                        {
                            method:
                                method,

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to save stock"
                    );
                }


                closeStockModal();


                await refresh();


                await categories();


                toast(
                    id
                        ? "Stock updated successfully"
                        : "Stock added successfully"
                );


            } catch (error) {

                console.error(
                    "Save stock error:",
                    error
                );

                toast(
                    error.message
                );
            }

        }
    );
}


// ============================================================
// EXCEL / CSV UPLOAD
// ============================================================

const uploadButton =
    document.getElementById("upload") ||
    document.getElementById("uploadBtn") ||
    document.getElementById("uploadButton");

const fileInput =
    document.getElementById("file") ||
    document.getElementById("fileInput") ||
    document.getElementById("uploadFile");


// ------------------------------------------------------------
// UPLOAD BUTTON
// ------------------------------------------------------------

if (uploadButton) {

    uploadButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            if (!fileInput) {

                toast(
                    "File input not found"
                );

                return;
            }

            fileInput.click();

        }
    );
}


// ------------------------------------------------------------
// FILE SELECTED
// ------------------------------------------------------------

if (fileInput) {

    fileInput.addEventListener(
        "change",
        async function () {

            if (
                !fileInput.files ||
                !fileInput.files.length
            ) {

                return;
            }


            const file =
                fileInput.files[0];


            const formData =
                new FormData();


            formData.append(
                "file",
                file
            );


            try {

                if (uploadButton) {

                    uploadButton.disabled =
                        true;

                    uploadButton.textContent =
                        "Uploading...";
                }


                const response =
                    await fetch(
                        "/api/upload",
                        {
                            method:
                                "POST",

                            body:
                                formData
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Upload failed"
                    );
                }


                toast(
                    data.message ||
                    "File uploaded successfully"
                );


                fileInput.value =
                    "";


                await refresh();

                await categories();


            } catch (error) {

                console.error(
                    "Upload error:",
                    error
                );

                toast(
                    error.message
                );


            } finally {

                if (uploadButton) {

                    uploadButton.disabled =
                        false;

                    uploadButton.textContent =
                        "Upload";
                }

            }

        }
    );
}
