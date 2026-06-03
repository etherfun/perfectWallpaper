export const countdownDefaults = {
    countdown_year: new Date().getFullYear(),
    countdown_month: new Date().getMonth() + 1,
    countdown_day: new Date().getDate(),
    countdown_color: [255, 255, 255] as [number, number, number],
    countdown_blurcolor_show: false,
    countdown_blurcolor: [255, 255, 255] as [number, number, number],
    countdown_yakeli_show: false,
    countdown_yakelic_color: [255, 255, 255] as [number, number, number],
    countdown_yakeli: 0,
    countdown_bluryakeli: 10,

    countdown_txt: '',
    countdown_txt1: '',
    first_load_countdown: true,

    countdown_y: 80,
    countdown_x: 50,
    countdown_size: 50,
    countdown_show: false,
    countdown_timetransparency: 80,
    countdown_roundedcorners: 0,
};

export type CountdownDefaults = typeof countdownDefaults;
