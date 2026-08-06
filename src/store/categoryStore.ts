import { useEffect, useSyncExternalStore } from "react";
import type { Category } from "../types/category";

// Import Controller Functions
import { fetchCategories, createUserCategory, updateUserCategory, deleteUserCategory } from "../controller/fetchController";

let categories: Category[] = [];
let hasLoaded = false;
let isLoading = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return categories;
}


// Function maps data from backend to frontend equivalent
function mapDataFromBackend(raw: any): Category{

  return({

    id: raw._id ?? raw.id,
    name: raw.name,
    color: raw.color, // hex
    accountIds: raw.socialMediaAccountIDs ?? [],

  })

}


// ---------------------------------------------------------------
// load — fetches categories from the backend once, caches locally
// ---------------------------------------------------------------

async function loadCategories(){

  // If function has already loaded or is still loading, just return
  if(hasLoaded || isLoading)
    return;

  isLoading = true;


  try{

    // Fetch categories of account from backend
    const categoryFetchRes = await fetchCategories();


    // Check if success or not, if so proceed with mapping and performing emit
    if(categoryFetchRes.success){

      categories = (categoryFetchRes.data ?? []).map(mapDataFromBackend);
      hasLoaded = true;
      emit();

    }else
      console.error("Error! Failed in fetching categories to load: ", categoryFetchRes.message);


  }catch(err){

    console.error("Error in loading categories: ", err);

  }finally{

    isLoading = false;

  }



}



// ---------------------------------------------------------------
// mutators — call these from Category.tsx (or anywhere)
// ---------------------------------------------------------------

export async function createCategory(newCategory: {name: string, color: string, socialMediaAccountIDs?: string[]}) {

    try {

    // Perform creation of user category by calling function from fetch controller
    const res = await createUserCategory(newCategory.name, newCategory.color, newCategory.socialMediaAccountIDs ?? []);

    // Check if operation was success or not
    if(!res.success){

      console.error("Failed to create category: ", res.message);
      return null;

    }

    const createdMappedCategory = mapDataFromBackend(res.data);

    // Update categories to add the new category and perform emit
    categories = [...categories, createdMappedCategory];
    emit();

    return createdMappedCategory; // Return new category

  }catch(err){

    console.error("Error creating new category: ", err);
    return ;

  }

}

export async function updateCategory(updated: Category) {

    try {

    // Perform creation of user category by calling function from fetch controller
    const res = await updateUserCategory(updated.id,{

      name: updated.name,
      color: updated.color,
      socialMediaAccountIDs: updated.accountIds,

    });

    // Check if operation was success or not
    if(!res.success){

      console.error("Failed to update category: ", res.message);
      return null;

    }

    const updatedMappedCategory = mapDataFromBackend(res.data);

    // Update categories to add the updated category or not and perform emit
    categories = categories.map((c) => c.id === updatedMappedCategory.id ? updatedMappedCategory : c);
    emit();

    return updatedMappedCategory; // Return updated category

  }catch(err){

    console.error("Error saving new category: ", err);
    return ;

  }

}

export async function deleteCategory(id: string) {

  try {

    // Perform deletion of user category by calling function from fetch controller
    const res = await deleteUserCategory(id);

    // Check if operation was success or not
    if(!res.success){

      console.error("Failed to delete category: ", res.message);
      return false;

    }

    // Update categories to remove the deleted category and perform emit
    categories = categories.filter((c) => c.id !== id);
    emit();

    return true;

  }catch(err){

    console.error("Error deleting category: ", err);
    return false;

  }

}



// ---------------------------------------------------------------
// hook — call this from any component that needs live category data
// ---------------------------------------------------------------

export function useCategories() {

  useEffect(()=> {

    loadCategories();

  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

}
