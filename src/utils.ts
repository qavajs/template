/**
 * Clone object
 * @param obj
 */
export function cloneDeep(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
}
