
     units = {
        chf: { eur: 1 / 1.2, usd: 1.1 },
        eur: { chf: 1.2, usd: 1.1 },
        usd: { eur: 1 / 1.1, chf: 1 / 1.1 }
    }

     accounts = {
        post: {
            unit: "chf",
            zahlungs: {
                balances: {
                    '20160101': 1000,
                    '20161101': 2000,
                    '20170101': 9000,
                    '20170210': 1000,
                },
                // transfer
                transfers: [
                    { account: "monthly", start: 20170101, rythm: "M", amount: 1400 },
                    { account: "spar", start: 20170101, rythm: "M", amount: 2000 },
                ],
            },
            monthly: {
                balances: {
                    '20170101': 100,
                },
                // transfer??
                //spar: { start: 20170101, rythm: "M",  amount: 1000 },
            },

            usd: {
                unit: "usd",
                balances: {
                    '20170101': 1000,
                }
            },
            eur: {
                unit: "eur",
                balances: {
                    '20170101': 10,
                }
            },
            spar: {
                balances: {
                    '20170101': 100,
                }
            },
            "3a": {
                balances: {
                    '20170101': 27000,
                }
            }
        },

    }

    // Key  Shorthand
    // years    y
    // quarters Q
    // months   M
    // weeks    w
    // days d
    // hours    h
    // minutes  m
    // seconds  s
    // milliseconds ms
     contracts = {
        account: "zahlungs",
        unit: "chf",
        rythm: "M",
        start: "20160101",

        ruckbildungen: {
            account: "spar",
        },
        transfers: {},
        apartment: {
            miete: {
                amount: 1800,
            },
            utils: {
                amount: 150,
            },
            elect: {
                amount: 150,
                rythm: "Q",
            },
            cleaning: {
                amount: 75,
                rythm: "w",
                supplies: {
                    amount: 25,
                    rythm: "M",
                    account: "monthly",
                },
            },
            insurance: {
                rythm: "y",
                haftpflicht: {
                    amount: 150,
                },
                hausrat: {
                    amount: 250,
                },
            },
        },
        health: {
            kk: {
                amount: 400,
                rythm: "M",
                francise: {
                    start: "20160301",
                    amount: 1000,
                    rythm: "y"
                },
                copay: {
                    amount: 30,
                },
            },
            drogery: {
                amount: 25,
                rythm: "M",
                account: "monthly",
            },
        },
        income: {
            lohn: {
                amount: -6000,
                rythm: "M",
                start: "20170131",
                bonus: {
                    amount: -9000,
                    rythm: "y",
                    start: "20171231",
                },
            },
            zulagen: {
                amount: -230,
                rythm: "M",
                start: "20170131",
                kendra: {
                    amount: 230,
                },
            },
        },
        tax: {
            ch: {
                amount: -6000,
                rythm: "y",
                start: "20171201",
            },
        },
        entertainmenttravel: {
            vacation: {
                amount: 1000,
                start: "20170701",
                rythm: "y",
            },
        },
        food: {
            daily: {
                rythm:"d",
                amount:20,
                account: "monthly",
            },
            work: {
                rythm:"w",
                amount:40,
                account: "monthly",
            },
            einkaufen: {
                rythm:"w",
                amount:100,
                account: "monthly",
            },
        },

        auto: {
            account: "zahlungs",
            rythm: "y",
            gas: {
                rythm: "M",
                amount: 70,
            },
            vinette: {
                start: "20161201",
                amount: 40,
            },
            insurance: {
                kaskoetc: {
                    amount: 1456, // 1456chf
                },
                garanteeextension: {
                    amount: 470,
                },
            },
            oil: {
                amount: 100,
            },
            service: {
                amount: 100,
            },
            tires: {
                rotation: {
                    start: "20160401",
                    rythm: "6-M",
                    amount: 100,
                },
                replacement: {
                    // amortisation: {
                    //     rythm: "M",
                    //     contract: "ruckbildungen",
                    //     transferAccount: "spar",
                    //     calc:"auto:match:..",
                    // },
                    account: "spar",
                    start: "20161201",
                    rythm: "4-y",
                    amount: 800,
                },
            },
            tradein: {
                start: "20150301",
                rythm: "3-y",
                account: "spar",
                amount: 5000,  // 2016.3.9 kauf 14,900; 1.6 scti titanium, km 43,000;  2017.06.1: km 58,090 : comparis: 13'578, 11'534
                // amortisation: {
                //     rythm: "M",
                //     contract: "ruckbildungen",
                //     calc:"auto:match:..",
                //     transferAccount: "spar",
                // },
            },
        }
    }


