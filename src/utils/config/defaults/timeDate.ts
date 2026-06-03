export const timeDateDefaults = {
    time_transparency: 0.8,
    time_x: 50,
    time_y: 50,

    date_format: {
        year_format: 1,
        month_format: 1,
        day_format: 1,
        week_format: 1,
        separator: 1,
        order: 1,
    },

    date_format_test: 1,

    t_show_sencends: true,
    time_color_rhythm: false,
    time_color: 'rgb(255, 255, 255)',
    time_blur_color: '0 0 20px rgb(255, 255, 255)',
    show_time: true,
    time_style: true,
    t_size: 100,

    odate_roundedcorners: 0,
    oclock_roundedcorners: 0,
    date_color_rhythm: false,
    date_color: [255, 255, 255] as [number, number, number],

    date_transparency: 0.8,

    show_date: true,

    date_x: 50,
    date_y: 45,

    date_size: 100,
    date_showwidth: 0,

    odate_color: [255, 255, 255] as [number, number, number],
    odate_blurcolor_show: false,
    odate_blurcolor: [255, 255, 255] as [number, number, number],
    odate_yakeli_show: false,
    odate_yakelic_color: [255, 255, 255] as [number, number, number],
    odate_yakeli: 0,
    odate_bluryakeli: 10,

    oclock_color: [255, 255, 255] as [number, number, number],
    oclock_blurcolor_show: false,
    oclock_blurcolor: [255, 255, 255] as [number, number, number],
    oclock_yakeli_show: false,
    oclock_yakelic_color: [255, 255, 255] as [number, number, number],
    oclock_yakeli: 0,
    oclock_bluryakeli: 10,
};

export type TimeDateDefaults = typeof timeDateDefaults;
