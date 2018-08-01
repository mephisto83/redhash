function makeState(){
    return {
        
    };
}
export default function (state, action){
    return state || makeState();
}