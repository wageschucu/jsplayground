/**
 * 
 */

var defaultLocale = "de"

var resources = {
    app: {
        name: {
            en: "choo test app"
        },
        title: {
            en: "Choo Test Application",
            de: "Choo Test Applikation",
            fr: "Choo Test Application"
        },
        author: {
            en: "Paul"
        }
    },
    system: {
        OSX: {
            en: "mac osx"
        }

    }

}

var locale = defaultLocale

function t(resource) {
    return deref(resources, resource);

}

function deref(resouces, resource) {
    if (resource) {
        
        resource = resource.split(".").reduce((accumulator, currentValue) => {
            return accumulator[currentValue]
        }, resources);

        if (typeof resources == "undefined")
            return ""
        if (typeof resources == "string")
            return resources
        else if (resource[locale])
            // if locale defined
            return resource[locale]
        else {
            // else get first defined property 
            for (var property in resource) {
                if (resource.hasOwnProperty(property)) {
                    return resource[property]
                }
            }
        }
    };
    return ""
}