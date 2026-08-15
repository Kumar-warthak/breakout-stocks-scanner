// ============================================================
// app_crud.js
// Stock Master CRUD + Upload
// Works alongside app_stream.js
// ============================================================

(function () {

    "use strict";

    // --------------------------------------------------------
    // ELEMENTS
    // --------------------------------------------------------

    const addButton = document.getElementById("add");
    const uploadButton = document.getElementById("upload");
    const fileInput = document.getElementById("file");

    const modal = document.getElementById("modal");
    const form = document.getElementById("form");

    const closeButton = document.getElementById("close");
    const cancelButton = document.getElementById("cancel");


    // --------------------------------------------------------
    // HELPERS
    // --------------------------------------------------------

    function showMessage(message) {

        const toast =
            document.getElementById("toast");

        if (toast) {

            toast.textContent = message;

            toast.classList.add("show");

            setTimeout(function () {
                toast.classList.remove("show");
            }, 3000);

        } else {

            alert(message);

        }
    }


    function openModal() {

        if (!modal) return;

        modal.style.display = "flex";
        modal.classList.add("show");
    }


    function closeModal() {

        if (!modal) return;

        modal.classList.remove("show");
        modal.style.display = "none";
    }


    function clearForm() {

        if (form) {
            form.reset();
        }

        const id =
            document.getElementById("id");

        if (id) {
            id.value = "";
        }

        const exchange =
            document.getElementById("exchange");

        if (exchange) {
            exchange.value = "NSE";
        }

        const title =
            document.getElementById("formTitle");

        if (title) {
            title.textContent = "Add Stock";
        }
    }


    function setValue(id, value) {

        const element =
            document.getElementById(id);

        if (element) {
            element.value =
                value === null ||
                value === undefined
                    ? ""
                    : value;
        }
    }


    // --------------------------------------------------------
    // DATE CONVERSION
    // Flask returns DD-MM-YYYY
    // HTML date input needs YYYY-MM-DD
    // --------------------------------------------------------

    function convertDateForInput(value) {

        if (!value) {
            return "";
        }

        value = String(value);

        // Already YYYY-MM-DD
        if (
            /^\d{4}-\d{2}-\d{2}$/.test(value)
        ) {
            return value;
        }

        // DD-MM-YYYY
        if (
            /^\d{2}-\d{2}-\d{4}$/.test(value)
        ) {

            const p =
                value.split("-");

            return (
                p[2] +
                "-" +
                p[1] +
                "-" +
                p[0]
            );
        }

        return value;
    }


    // --------------------------------------------------------
    // REFRESH MASTER TABLE
    //
    // app_stream.js already has refresh().
    // We call it if available.
    // --------------------------------------------------------

    async function refreshMaster() {

        if (
            typeof window.refresh ===
            "function"
        ) {

            await window.refresh();

            return;
        }

        console.warn(
            "refresh() from app_stream.js not available."
        );
    }


    // --------------------------------------------------------
    // REFRESH CATEGORIES
    //
    // app_stream.js already has categories().
    // --------------------------------------------------------

    async function refreshCategories() {

        if (
            typeof window.categories ===
            "function"
        ) {

            await window.categories();

        }
    }


    // ========================================================
    // ADD STOCK
    // ========================================================

    if (addButton) {

        addButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                clearForm();

                openModal();

            }
        );
    }


    // ========================================================
    // CLOSE MODAL
    // ========================================================

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                closeModal();

            }
        );
    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                closeModal();

            }
        );
    }


    // Click outside modal

    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === modal
                ) {

                    closeModal();

                }
            }
        );
    }


    // ========================================================
    // SAVE STOCK
    // POST /api/stocks
    // PUT /api/stocks/<id>
    // ========================================================

    if (form) {

        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const id =
                    document.getElementById(
                        "id"
                    )?.value.trim();


                const date =
                    document.getElementById(
                        "date"
                    )?.value;


                const symbol =
                    document.getElementById(
                        "symbol"
                    )?.value.trim();


                const stockName =
                    document.getElementById(
                        "stock_name"
                    )?.value.trim();


                const exchange =
                    document.getElementById(
                        "exchange"
                    )?.value.trim();


                const breakoutLevel =
                    document.getElementById(
                        "breakout_level"
                    )?.value;


                const stoploss =
                    document.getElementById(
                        "stoploss"
                    )?.value;


                const currentPrice =
                    document.getElementById(
                        "current_price"
                    )?.value;


                const youtuber =
                    document.getElementById(
                        "youtuber"
                    )?.value.trim();


                const advisor =
                    document.getElementById(
                        "advisor"
                    )?.value.trim();


                const category =
                    document.getElementById(
                        "categoryForm"
                    )?.value.trim();


                // ------------------------------------------------
                // VALIDATION
                // ------------------------------------------------

                if (!date) {
                    showMessage(
                        "Please select Date."
                    );
                    return;
                }


                if (!symbol) {
                    showMessage(
                        "Please enter Symbol."
                    );
                    return;
                }


                if (!stockName) {
                    showMessage(
                        "Please enter Stock Name."
                    );
                    return;
                }


                if (!breakoutLevel) {
                    showMessage(
                        "Please enter Breakout Level."
                    );
                    return;
                }


                if (!stoploss) {
                    showMessage(
                        "Please enter StopLoss."
                    );
                    return;
                }


                if (!category) {
                    showMessage(
                        "Please select Category."
                    );
                    return;
                }


                // ------------------------------------------------
                // PAYLOAD
                // ------------------------------------------------

                const payload = {

                    date: date,

                    symbol: symbol,

                    stock_name: stockName,

                    exchange:
                        exchange || "NSE",

                    breakout_level:
                        breakoutLevel,

                    stoploss:
                        stoploss,

                    current_price:
                        currentPrice || null,

                    youtuber:
                        youtuber || "",

                    advisor:
                        advisor || "",

                    category:
                        category
                };


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
                            "/api/stocks/" +
                            encodeURIComponent(id);

                        method =
                            "PUT";
                    }


                    // Disable save button

                    const saveButton =
                        form.querySelector(
                            'button[type="submit"]'
                        );

                    if (saveButton) {
                        saveButton.disabled =
                            true;

                        saveButton.textContent =
                            "Saving...";
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
                            "Unable to save stock."
                        );
                    }


                    closeModal();


                    showMessage(
                        id
                            ? "Stock updated successfully."
                            : "Stock added successfully."
                    );


                    // Reload master data

                    await refreshMaster();

                    await refreshCategories();


                } catch (error) {

                    console.error(
                        "SAVE ERROR:",
                        error
                    );

                    showMessage(
                        error.message ||
                        "Unable to save stock."
                    );


                } finally {

                    const saveButton =
                        form.querySelector(
                            'button[type="submit"]'
                        );

                    if (saveButton) {

                        saveButton.disabled =
                            false;

                        saveButton.textContent =
                            "Save";
                    }

                }

            }
        );
    }


    // ========================================================
    // UPLOAD BUTTON
    // ========================================================

    if (uploadButton) {

        uploadButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                if (!fileInput) {

                    showMessage(
                        "File input not found."
                    );

                    return;
                }

                fileInput.click();

            }
        );
    }


    // ========================================================
    // FILE SELECTED
    // ========================================================

    if (fileInput) {

        fileInput.addEventListener(
            "change",
            async function () {

                if (
                    !fileInput.files ||
                    fileInput.files.length === 0
                ) {

                    return;
                }


                const file =
                    fileInput.files[0];


                const fileName =
                    file.name.toLowerCase();


                // Check extension

                if (
                    !fileName.endsWith(".xlsx") &&
                    !fileName.endsWith(".csv")
                ) {

                    showMessage(
                        "Please select CSV or XLSX file."
                    );

                    fileInput.value = "";

                    return;
                }


                const formData =
                    new FormData();


                formData.append(
                    "file",
                    file
                );


                try {

                    uploadButton.disabled =
                        true;

                    uploadButton.textContent =
                        "Uploading...";


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
                            "Upload failed."
                        );
                    }


                    console.log(
                        "UPLOAD RESPONSE:",
                        data
                    );


                    showMessage(
                        data.message ||
                        "Upload successful."
                    );


                    fileInput.value =
                        "";


                    // Reload table

                    await refreshMaster();

                    await refreshCategories();


                } catch (error) {

                    console.error(
                        "UPLOAD ERROR:",
                        error
                    );


                    showMessage(
                        error.message ||
                        "Upload failed."
                    );


                } finally {

                    uploadButton.disabled =
                        false;

                    uploadButton.textContent =
                        "⇧ Upload";

                }

            }
        );
    }


    // ========================================================
    // EDIT STOCK
    // ========================================================
    //
    // Call:
    //
    // editStock(id)
    //
    // from your table.
    // ========================================================

    window.editStock =
        async function (stockId) {

            if (!stockId) {
                return;
            }


            try {

                const response =
                    await fetch(
                        "/api/stocks?page=1&page_size=500"
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to load stocks."
                    );
                }


                const stocks =
                    data.items || [];


                const stock =
                    stocks.find(
                        function (item) {

                            return String(
                                item.id
                            ) === String(
                                stockId
                            );

                        }
                    );


                if (!stock) {

                    showMessage(
                        "Stock not found."
                    );

                    return;
                }


                // Fill form

                setValue(
                    "id",
                    stock.id
                );

                setValue(
                    "date",
                    convertDateForInput(
                        stock.date
                    )
                );

                setValue(
                    "symbol",
                    stock.symbol
                );

                setValue(
                    "stock_name",
                    stock.stock_name
                );

                setValue(
                    "exchange",
                    stock.exchange || "NSE"
                );

                setValue(
                    "breakout_level",
                    stock.breakout_level
                );

                setValue(
                    "stoploss",
                    stock.stoploss
                );

                setValue(
                    "current_price",
                    stock.current_price
                );

                setValue(
                    "youtuber",
                    stock.youtuber
                );

                setValue(
                    "advisor",
                    stock.advisor
                );

                setValue(
                    "categoryForm",
                    stock.category
                );


                const title =
                    document.getElementById(
                        "formTitle"
                    );

                if (title) {

                    title.textContent =
                        "Edit Stock";

                }


                openModal();


            } catch (error) {

                console.error(
                    "EDIT ERROR:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to load stock."
                );

            }

        };


    // ========================================================
    // DELETE STOCK
    // ========================================================

    window.deleteStock =
        async function (stockId) {

            if (!stockId) {
                return;
            }


            const confirmed =
                window.confirm(
                    "Are you sure you want to delete this stock?"
                );


            if (!confirmed) {
                return;
            }


            try {

                const response =
                    await fetch(
                        "/api/stocks/" +
                        encodeURIComponent(
                            stockId
                        ),
                        {
                            method:
                                "DELETE"
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to delete stock."
                    );
                }


                showMessage(
                    data.message ||
                    "Stock deleted successfully."
                );


                await refreshMaster();

                await refreshCategories();


            } catch (error) {

                console.error(
                    "DELETE ERROR:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to delete stock."
                );

            }

        };


    // ========================================================
    // DEBUG
    // ========================================================

    console.log(
        "app_crud.js loaded successfully"
    );

})();