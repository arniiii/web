"""Optional, repeatable demo data. Does not overwrite an existing demo account."""
from datetime import date, timedelta
from sqlalchemy import select
from app.models import User, Subject, Task
from app.core.database import SessionLocal
from app.core.security import password_hash

EMAIL = "demo@semester.app"
PASSWORD = "Semester2026!"  # Public credentials for the deliberately disposable demo account.


def main() -> None:
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == EMAIL)):
            print("Демо-аккаунт уже существует. Данные оставлены без изменений.")
            return
        user = User(name="Студент", email=EMAIL, password_hash=password_hash.hash(PASSWORD), study_group="БПИ-31", university="ТГТУ")
        db.add(user)
        db.flush()
        descriptions = [
            ("Веб-программирование II", "Иванов И. И.", "#4c7666", "React, API и разработка клиент-серверных приложений."),
            ("Базы данных", "Петрова А. С.", "#8575b1", "Реляционная модель, SQL, проектирование схем и транзакции."),
            ("Алгоритмы и структуры данных", "Смирнов Д. В.", "#bd8050", "Алгоритмическое мышление и оценка сложности."),
            ("Английский язык", "Соколова Е. Н.", "#577da3", "Академический английский и профессиональная лексика."),
        ]
        subjects = []
        for title, teacher, color, description in descriptions:
            subject = Subject(user_id=user.id, title=title, teacher=teacher, color=color, description=description)
            db.add(subject)
            subjects.append(subject)
        db.flush()
        rows = [
            (0, "Лабораторная работа: React Hooks", -2, "high", "in_progress", "Собрать форму и вынести повторяющуюся логику в собственный хук."),
            (1, "Спроектировать схему базы данных", 0, "high", "in_progress", "Выделить сущности, определить связи и подготовить первую миграцию."),
            (0, "Подготовить API для курсовой", 1, "high", "todo", "Добавить маршруты дисциплин и заданий, проверить валидацию."),
            (2, "Практика: деревья поиска", 3, "medium", "todo", "Реализовать поиск и обход бинарного дерева."),
            (3, "Прочитать статью и составить словарь", 5, "low", "todo", "Выписать 15 терминов по теме разработки программного обеспечения."),
            (1, "Задачи на JOIN и группировку", 8, "medium", "todo", "Подготовить запросы и объяснить полученные результаты."),
            (0, "Подготовить макет интерфейса", -5, "medium", "done", "Спроектировать страницы обзора, дисциплин и заданий."),
            (2, "Разобрать сложность сортировок", -4, "medium", "done", "Сравнить временную сложность основных алгоритмов."),
            (3, "Подготовить рассказ о проекте", -1, "low", "done", "Коротко описать цель и основные возможности приложения."),
        ]
        for index, title, offset, priority, status, description in rows:
            db.add(Task(subject_id=subjects[index].id, title=title, due_date=date.today() + timedelta(days=offset), priority=priority, status=status, description=description))
        db.commit()
    print(f"Демо готово. Почта: {EMAIL}; пароль: {PASSWORD}")


if __name__ == "__main__":
    main()
