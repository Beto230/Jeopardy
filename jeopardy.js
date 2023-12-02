let categories = [];
const BASE_URL = `https://jservice.io/api`;
const QUESTION_COUNT = 5;
const CATEGORY_COUNT = 6;

class Category {
    static async getCategoryIds() {
        let response = await axios.get(`${BASE_URL}/categories`, {
            params: {
                count: "100", 
                offset: Math.floor(Math.random() * (500-1) + 1)
            }
        });

        let randomCategories = _.sampleSize(response.data, CATEGORY_COUNT)

        let categoryIds = randomCategories.map((catObj) => {
            return catObj.id;
        });

        return categoryIds;
    }

    static async getAllCategoriesAndQuestions() {
        categories = [];
        let categoryIds = await Category.getCategoryIds();
        for (let categoryId of categoryIds) {
            let fullCategory = await Category.getCategory(categoryId);
            categories.push(fullCategory);
        }
        return categories;
    }

    static async getCategory(catId) {
        let response = await axios.get(`${BASE_URL}/clues`, {
            params: { 
                category: catId
            }
        });

        let selectFiveQuestions = _.sampleSize(response.data, QUESTION_COUNT);

        let questionArray = selectFiveQuestions.map((question) => {
            if (question.answer.startsWith('<i>')) {
                question.answer = question.answer.slice(3, -3);
            }
            return {
                question: question.question, 
                answer: question.answer, 
                showing: null
            }
        });

        let categoryQuestions = {
            title: response.data[0].category.title, 
            clues: questionArray
        }
        return categoryQuestions;
    }
}

$(async function() {
    const $button = $("button");
    const $tDiv = $("#table-container");

    function toTitleCase(str) {
        let lcStr = str.toLowerCase();
        return lcStr.replace(/(?:^|\s)\w/g, (match) => {
            return match.toUpperCase();
        });
    }

    async function fillTable() {
        let $tHead = $("<thead>");
        let $tBody = $("<tbody>");
        let $table = $("<table>")
            .prepend($tHead)
            .append($tBody);
        
        for (let j = 0; j < QUESTION_COUNT; j++) {
            let $tRow = $("<tr>");
            for (let i = 0; i < CATEGORY_COUNT; i++) {
                let $qMark = $("<i>")
                    .attr("class", "fas fa-question-circle");
                let $tCell = $("<td>")
                    .attr("id", `${i}-${j}`)
                    .append($qMark);
                $tRow.append($tCell);
            }
            $tBody.append($tRow);
        }
        for (let k = 0; k< CATEGORY_COUNT; k++) {
            let $tCell = $("<th>")
                .attr("id", `cat-${k}`)
                .text(toTitleCase(categories[k].title));
            $tHead.append($tCell);
        }

        $tDiv.append($table);
    }

    function showQuestionOrAnswer(id) {
        let $clickedCell = $(`#${id}`);
        let category = id.slice(0,1);
        let question = id.slice(2);
        let theCell = categories[category].clues[question];
        let theQuestion = theCell.question; 
        let theAnswer = theCell.answer;

        if(theCell.showing === null) {
            $clickedCell.text(theQuestion);
            theCell.showing = "question";
        } else if (theCell.showing === "question" ){
            $clickedCell.toggleClass("answer")
            $clickedCell.text(theAnswer);
            theCell.showing = "answer";
            $clickedCell.toggleClass("not-allowed");
        }
    }

    function showLoadingView() {
        $button.text("Loading...").toggleClass("not-allowed");
        $tDiv.empty();
        let $loading = $("<i>")
            .attr("class", "fas fa-spinner fa-pulse loader");
        $tDiv.append($loading);
    }

    function hideLoadingView() {
        $button.text("Restart!").toggleClass("not-allowed");
        $tDiv.empty();
    }

    async function setupAndStart () {
        showLoadingView();
        await Category.getAllCategoriesAndQuestions();
        hideLoadingView();
        fillTable();
        addListeners();
    }

    $button.on("click", async () => {
        setupAndStart();
    });

    async function addListeners() {
        const $gameTable = $("table");
        $gameTable.on("click", "td", (evt) => {
            showQuestionOrAnswer(evt.target.id);
        });
    }
});