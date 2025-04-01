// apiUtils.js or dataUtils.js
export const fetchCollegesData = async () => {
    try {
        const response = await fetch("http://localhost:5000/api/colleges");
        if (!response.ok) {
            throw new Error("Failed to fetch colleges");
        }
        return await response.json();
    } catch (error) {
        throw error; // Rethrow the error to be handled in the component
    }
};