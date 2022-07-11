import Recipe from './model/recipe';
import Search from './model/search';
import List from './model/list';
import Like from './model/like';
import { clearLoader, elements, renderLoader } from './view/base';
import * as searchView from './view/searchView';
import * as recipeView from './view/recipeView';
import * as listView from './view/listView';
import * as likesView from './view/likesView';

const state = {};
window.state = state;

const controlSearch = async () => {

    const query = searchView.getInput();

    if(query){
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchResList);
        state.search = new Search(query);
        await state.search.getResults()

        clearLoader();
        searchView.renderResult(state.search.result)
    }
}

//recipe
const controlRecipe = async () => {
    const id = window.location.hash.replace('#', '');
    if(id){
        // prepare UI
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        state.search && searchView.activeLinkStyle(id);

        //create new recipe object
        state.recipe = new Recipe(id);

        try {
            await state.recipe.getRecipe();
        } catch (error) {
            alert('recipe error')
        }
        state.recipe.parseIngredients();

        //calculate time and servings
        state.recipe.calcTime();
        state.recipe.calcServing();

        clearLoader();
        recipeView.renderRecipe(state.recipe, state.likes.isLiked(id))
    }
}

//shopping list
const controlList = () => {
    // Create a new list
    if(!state.list) state.list = new List();

    elements.shopping.innerHTML = '';

    //add each ingredient
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItems(el.count, el.unit, el.ingredient)
        listView.renderItem(item);
    })
}


const controlLike = () => {
    if(!state.likes) state.likes = new Like();

    const currentId = state.recipe.id;

    if(!state.likes.isLiked(currentId)){
        //addlike to the state
        const newLike =  state.likes.addLike(
            currentId,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
            );

            //toggle button
            likesView.toggleLikeBtn(true);

            likesView.renderLike(newLike);

    }else{
        //delete like from state
        state.likes.deleteLike(currentId)


        //toggle button
        likesView.toggleLikeBtn(false);
        
        //delete likde from the UI
        likesView.deleteLike(currentId);
    }

    likesView.toggleLikeMenu(state.likes.getLikeNum());

}

//handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        //delete items

        state.list.deleteItem(id);
        listView.deleteItem(id)
    }else if(e.target.matches('.shopping__count__input')){
        //update items
        const newValue = +e.target.value;
        state.list.updateItem(id, newValue);
    }
})


elements.searchForm.addEventListener('submit', (e) =>{
    e.preventDefault();
    controlSearch()
})

elements.searchResPages.addEventListener('click', e=> {
    const btn = e.target.closest('.btn-inline');
    if(btn){
        const goToPage = +btn.dataset.goto;
        searchView.clearResults();
        searchView.renderResult(state.search.result, goToPage);
    }
})

window.addEventListener('hashchange', () => {
    controlRecipe();
})

window.addEventListener('load', () => {
    state.likes = new Like();

    state.likes.readStorage();

    state.likes.likes.forEach(like => likesView.renderLike(like));

    likesView.toggleLikeMenu(state.likes.getLikeNum());

    controlRecipe();
})

elements.recipe.addEventListener('click', e=> {
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        //decrease button
        if(state.recipe.servings > 1){
            state.recipe.updateServingIngredient('dec');
            recipeView.updateServingIngredient(state.recipe);
        }
    }else if(e.target.matches('btn-increase, .btn-increase *')){
        state.recipe.updateServingIngredient('inc');
        recipeView.updateServingIngredient(state.recipe);

    }else if(e.target.matches('.recipe__btn__add, .recipe__btn__add *')){
        controlList();
    }else if(e.target.matches('.recipe__love, .recipe__love *')){
        //like controller
        controlLike()
    }
})