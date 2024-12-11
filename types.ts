export type Projectile = {
    x_loc:number,
    y_loc:number,
    instantiation_time:number
}

export type Player = {
    name:string,
    projectiles_fired:Projectile[], 
    score:number,
}
