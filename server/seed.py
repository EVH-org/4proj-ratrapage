import uuid
from datetime import date

from app.db.session import SessionLocal
from app.models.user import User
from app.models.user_preference import UserPreference
from app.models.cookbook import Cookbook, CookbookMember
from app.models.recipe import Recipe, RecipeStep, RecipeIngredient, RecipeTag, Tag
from app.crud.recipe import _process_recipe_tags
from app.security import hash_password


def _add_recipe(db, scope, visibility, owner_id, cookbook_id, creator_id,
                title, description, prep, cook, servings,
                steps_and_ingredients, tags):
    recipe = Recipe(
        id=uuid.uuid4(),
        scope_type=scope,
        visibility=visibility,
        owner_user_id=owner_id,
        cookbook_id=cookbook_id,
        created_by_user_id=creator_id,
        title=title,
        description=description,
        prep_time_minutes=prep,
        cook_time_minutes=cook,
        servings=servings,
    )
    _process_recipe_tags(db, recipe, tags)
    db.add(recipe)
    db.flush()

    steps, ingredients = steps_and_ingredients
    for i, step_text in enumerate(steps, 1):
        db.add(RecipeStep(recipe_id=recipe.id, step_order=i, instruction=step_text))
    for i, (name, qty, unit, note) in enumerate(ingredients, 1):
        db.add(RecipeIngredient(recipe_id=recipe.id, line_order=i, name=name, quantity=qty, unit=unit, note=note))
    return recipe


def seed():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "testchef@cuisine.fr").first()
        if existing:
            print("Base deja initialisee.")
            return

        chef = User(id=uuid.uuid4(), email="testchef@cuisine.fr", password_hash=hash_password("chefpassword"), display_name="Chef Martin")
        marie = User(id=uuid.uuid4(), email="marie@cuisine.fr", password_hash=hash_password("password"), display_name="Marie Dupont")
        paul = User(id=uuid.uuid4(), email="paul@cuisine.fr", password_hash=hash_password("password"), display_name="Paul Durand")
        for u in [chef, marie, paul]:
            db.add(u)
            db.flush()
            db.add(UserPreference(user_id=u.id))
        db.flush()

        cb = Cookbook(
            id=uuid.uuid4(),
            owner_user_id=chef.id,
            name="Pâtisseries & Gourmandises",
            description="Un livre de recettes sucrées pour les becs sucrés.",
            visibility="public",
        )
        db.add(cb)
        db.flush()
        db.add(CookbookMember(cookbook_id=cb.id, user_id=chef.id, role="owner"))
        db.flush()

        def recipe_perso(title, desc, prep, cook, servings, steps_ing, tags, visibility="public"):
            return _add_recipe(db, "personal", visibility, chef.id, None, chef.id, title, desc, prep, cook, servings, steps_ing, tags)

        def recipe_cookbook(title, desc, prep, cook, servings, steps_ing, tags):
            return _add_recipe(db, "cookbook", "public", None, cb.id, chef.id, title, desc, prep, cook, servings, steps_ing, tags)

        def recipe_marie(title, desc, prep, cook, servings, steps_ing, tags, visibility="public"):
            return _add_recipe(db, "personal", visibility, marie.id, None, marie.id, title, desc, prep, cook, servings, steps_ing, tags)

        def recipe_paul(title, desc, prep, cook, servings, steps_ing, tags, visibility="public"):
            return _add_recipe(db, "personal", visibility, paul.id, None, paul.id, title, desc, prep, cook, servings, steps_ing, tags)

        recipe_perso(
            "Tarte aux légumes du soleil",
            "Une tarte salée garnie de légumes méditerranéens, parfaite pour un dîner léger.",
            25, 35, 6,
            (["Préchauffer le four à 180°C.", "Dérouler la pâte brisée et la piquer.",
              "Laver et couper les légumes en fines rondelles.", "Disposer les légumes en rosace sur la pâte.",
              "Mélanger les oeufs avec la crème, sel et poivre.", "Verser l'appareil et enfourner 35 minutes."],
             [("Pâte brisée", 1, "unité", None), ("Courgette", 1, "pièce", "moyenne"),
              ("Tomate", 2, "pièces", None), ("Aubergine", 1, "pièce", "petite"),
              ("Oeuf", 3, "pièces", None), ("Crème fraîche", 200, "ml", None),
              ("Sel", None, None, None), ("Poivre", None, None, None)]),
            ["tarte", "végétarien", "méditerranéen", "légumes"],
        )

        recipe_perso(
            "Poulet rôti aux herbes",
            "Un poulet rôti croustillant aux herbes de Provence, accompagné de pommes de terre fondantes.",
            20, 75, 4,
            (["Préchauffer le four à 200°C.", "Mélanger le beurre mou avec les herbes et l'ail haché.",
              "Masser le poulet avec le beurre aux herbes.", "Disposer les pommes de terre autour du poulet.",
              "Enfourner 75 minutes en arrosant régulièrement.", "Laisser reposer 10 minutes avant de découper."],
             [("Poulet", 1, "pièce", "1,5 kg"), ("Pomme de terre", 800, "g", None),
              ("Beurre", 50, "g", None), ("Herbes de Provence", 2, "c. à soupe", None),
              ("Ail", 3, "gousses", None), ("Sel", None, None, None), ("Poivre", None, None, None)]),
            ["viande", "rôti", "traditionnel", "poulet"],
        )

        recipe_perso(
            "Soupe de potiron au gingembre",
            "Une soupe onctueuse au potiron relevée d'une pointe de gingembre frais.",
            15, 30, 4,
            (["Peler et couper le potiron en cubes.", "Émincer l'oignon et le gingembre.",
              "Faire revenir l'oignon dans l'huile d'olive.", "Ajouter le potiron, le gingembre et couvrir d'eau.",
              "Cuire 25 minutes à feu moyen.", "Mixer, saler, poivrer et servir avec un filet de crème."],
             [("Potiron", 800, "g", None), ("Oignon", 1, "pièce", None),
              ("Gingembre frais", 20, "g", None), ("Huile d'olive", 2, "c. à soupe", None),
              ("Crème liquide", 50, "ml", None), ("Sel", None, None, None), ("Poivre", None, None, None)]),
            ["soupe", "végétarien", "automne", "potiron", "gingembre"],
        )

        recipe_perso(
            "Gratin dauphinois",
            "Le classique gratin de pommes de terre à la crème, gratiné à souhait.",
            25, 60, 6,
            (["Préchauffer le four à 180°C.", "Peler et couper les pommes de terre en fines rondelles.",
              "Frotter le plat avec la gousse d'ail.", "Disposer les pommes de terre en couches avec crème, sel, poivre et muscade.",
              "Recouvrir de fromage râpé.", "Enfourner 60 minutes jusqu'à ce que le dessus soit doré."],
             [("Pomme de terre", 1, "kg", None), ("Crème liquide", 300, "ml", None),
              ("Ail", 1, "gousse", None), ("Fromage râpé", 100, "g", "gruyère"),
              ("Noix de muscade", None, None, "une pincée"), ("Sel", None, None, None), ("Poivre", None, None, None)]),
            ["gratin", "pomme de terre", "traditionnel", "gratiné"],
        )

        recipe_perso(
            "Salade secrète du chef",
            "Une salade personnelle que le chef garde pour lui.",
            10, 0, 1,
            (["Laver la salade.", "Couper les tomates.", "Assaisonner."],
             [("Salade verte", 100, "g", None), ("Tomate", 1, "pièce", None),
              ("Vinaigrette", 1, "c. à soupe", None)]),
            ["salade", "rapide"],
            visibility="private",
        )

        recipe_cookbook(
            "Fondant au chocolat",
            "Un coeur coulant au chocolat noir, dessert incontournable des amateurs de cacao.",
            20, 12, 4,
            (["Préchauffer le four à 200°C.", "Faire fondre le chocolat et le beurre au bain-marie.",
              "Fouetter les oeufs et le sucre jusqu'à blanchiment.", "Incorporer le chocolat fondu puis la farine.",
              "Verser dans des moules beurrés.", "Enfourner 12 minutes, le coeur doit rester coulant."],
             [("Chocolat noir", 200, "g", "70%"), ("Beurre", 125, "g", None),
              ("Oeuf", 4, "pièces", None), ("Sucre", 100, "g", None),
              ("Farine", 50, "g", None)]),
            ["chocolat", "dessert", "fondant"],
        )

        recipe_cookbook(
            "Tarte au citron meringuée",
            "Une tarte acidulée surmontée d'une meringue légère et dorée.",
            40, 30, 8,
            (["Préparer la pâte sablée et la faire cuire à blanc.", "Préparer le lemon curd : mélanger le jus de citron, le sucre, les oeufs et la maïzena.",
              "Cuire le lemon curd à feu doux jusqu'à épaississement.", "Monter les blancs en neige avec le sucre glace.",
              "Verser le lemon curd sur le fond de tarte.", "Recouvrir de meringue et dorer au four 10 minutes."],
             [("Pâte sablée", 1, "unité", None), ("Citron", 4, "pièces", "jus + zestes"),
              ("Oeuf", 3, "pièces", "pour le curd"), ("Sucre", 150, "g", None),
              ("Maïzena", 30, "g", None), ("Blanc d'oeuf", 3, "pièces", "pour la meringue"),
              ("Sucre glace", 100, "g", None)]),
            ["citron", "dessert", "tarte", "meringuée"],
        )

        recipe_cookbook(
            "Crème brûlée à la vanille",
            "Une crème onctueuse parfumée à la vanille Bourbon, sous une fine couche de caramel.",
            20, 60, 4,
            (["Préchauffer le four à 150°C.", "Fendre la gousse de vanille et gratter les grains.",
              "Chauffer la crème avec la vanille.", "Blanchir les jaunes avec le sucre.",
              "Verser la crème chaude sur les jaunes en fouettant.", "Répartir dans des ramequins et cuire au bain-marie 55 minutes.",
              "Réfrigérer 4 heures, puis saupoudrer de sucre et caraméliser au chalumeau."],
             [("Crème liquide", 500, "ml", "entière"), ("Vanille", 1, "gousse", "Bourbon"),
              ("Jaune d'oeuf", 6, "pièces", None), ("Sucre", 100, "g", None),
              ("Sucre roux", 40, "g", "pour la caramélisation")]),
            ["vanille", "dessert", "crème", "caramel"],
        )

        recipe_cookbook(
            "Moelleux aux poires et amandes",
            "Un gâteau tout doux aux poires fondantes et à la poudre d'amandes.",
            15, 40, 6,
            (["Préchauffer le four à 170°C.", "Mélanger le beurre mou et le sucre jusqu'à crème.",
              "Ajouter les oeufs un par un, puis la poudre d'amandes et la farine.",
              "Peler et couper les poires en lamelles.", "Verser la pâte dans un moule, disposer les poires.",
              "Enfourner 40 minutes. Vérifier la cuisson à la pointe du couteau."],
             [("Beurre", 100, "g", None), ("Sucre", 100, "g", None),
              ("Oeuf", 3, "pièces", None), ("Poudre d'amandes", 120, "g", None),
              ("Farine", 80, "g", None), ("Poire", 3, "pièces", "mûres")]),
            ["poire", "amande", "dessert", "gâteau"],
        )

        recipe_marie(
            "Boeuf bourguignon",
            "Le grand classique mijoté au vin rouge, comme le faisait ma grand-mère.",
            30, 180, 6,
            (["Couper la viande en cubes.", "Faire revenir la viande dans l'huile.",
              "Ajouter les oignons et les carottes.", "Saupoudrer de farine et mélanger.",
              "Verser le vin rouge et le bouillon.", "Saler, poivrer, ajouter le bouquet garni.",
              "Laisser mijoter 3 heures à feu doux.", "Ajouter les champignons 30 minutes avant la fin."],
             [("Boeuf à braiser", 1, "kg", None), ("Vin rouge", 75, "cl", "Bourgogne"),
              ("Oignon", 2, "pièces", None), ("Carotte", 3, "pièces", None),
              ("Champignon", 250, "g", None), ("Farine", 30, "g", None),
              ("Bouquet garni", 1, "pièce", None), ("Huile", 2, "c. à soupe", None)]),
            ["viande", "mijoté", "traditionnel", "boeuf", "bourguignon"],
        )

        recipe_marie(
            "Quiche lorraine",
            "Une quiche traditionnelle aux lardons fumés et au gruyère.",
            20, 35, 6,
            (["Préchauffer le four à 180°C.", "Dérouler la pâte et la piquer.",
              "Faire revenir les lardons sans matière grasse.", "Mélanger les oeufs, la crème, sel, poivre.",
              "Répartir les lardons sur la pâte, verser l'appareil.", "Parsemer de gruyère et enfourner 35 minutes."],
             [("Pâte brisée", 1, "unité", None), ("Lardons fumés", 200, "g", None),
              ("Oeuf", 3, "pièces", None), ("Crème fraîche", 200, "ml", None),
              ("Gruyère râpé", 100, "g", None), ("Sel", None, None, None), ("Poivre", None, None, None)]),
            ["quiche", "lorraine", "traditionnel", "tarte salée"],
        )

        recipe_paul(
            "Curry de pois chiches",
            "Un curry végétarien épicé aux pois chiches et au lait de coco, rapide et savoureux.",
            10, 25, 4,
            (["Émincer l'oignon et l'ail.", "Faire revenir dans l'huile avec les épices.",
              "Ajouter les pois chiches égouttés et les tomates concassées.",
              "Verser le lait de coco et laisser mijoter 20 minutes.", "Servir avec du riz basmati."],
             [("Pois chiches", 400, "g", "en boîte"), ("Lait de coco", 400, "ml", None),
              ("Tomate concassée", 200, "g", None), ("Oignon", 1, "pièce", None),
              ("Ail", 2, "gousses", None), ("Curry en poudre", 2, "c. à café", None),
              ("Riz basmati", 300, "g", None)]),
            ["curry", "végétarien", "pois chiches", "épicé", "indien"],
        )

        recipe_paul(
            "Gaspacho andalou",
            "Une soupe froide rafraîchissante aux tomates et concombre, parfaite pour l'été.",
            15, 0, 4,
            (["Peler et épépiner les tomates.", "Éplucher le concombre et le poivron.",
              "Tout mixer avec l'ail, l'huile d'olive et le vinaigre.", "Saler, poivrer.",
              "Réserver au frais au moins 2 heures avant de servir."],
             [("Tomate", 800, "g", "bien mûres"), ("Concombre", 1, "pièce", None),
              ("Poivron rouge", 1, "pièce", None), ("Ail", 1, "gousse", None),
              ("Huile d'olive", 4, "c. à soupe", None), ("Vinaigre de Xérès", 2, "c. à soupe", None)]),
            ["gaspacho", "froid", "été", "végétarien", "espagnol"],
        )

        recipe_marie(
            "Lasagnes à la bolognaise",
            "Des lasagnes maison avec une sauce bolognaise mijotée et une béchamel onctueuse.",
            40, 45, 8,
            (["Préparer la sauce bolognaise : faire revenir oignon, ail et viande.",
              "Ajouter les tomates concassées, herbes, sel, poivre. Mijoter 30 minutes.",
              "Préparer la béchamel : beurre, farine, lait, muscade.", "Préchauffer le four à 180°C.",
              "Alterner couches de pâtes, bolognaise, béchamel, parmesan.", "Enfourner 45 minutes."],
             [("Pâtes à lasagnes", 12, "feuilles", None), ("Boeuf haché", 500, "g", None),
              ("Tomate concassée", 400, "g", None), ("Oignon", 1, "pièce", None),
              ("Ail", 2, "gousses", None), ("Lait", 750, "ml", None),
              ("Farine", 50, "g", None), ("Beurre", 50, "g", None),
              ("Parmesan", 100, "g", None), ("Muscade", None, None, "une pincée")]),
            ["pâtes", "lasagnes", "italien", "viande", "gratin"],
        )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()