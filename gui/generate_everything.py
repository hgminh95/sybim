from jinja2 import Environment, FileSystemLoader, select_autoescape
import shutil
import os
import uuid


class Generator:
    def __init__(self, source_folder, build_folder='./_build'):
        self.build_number = uuid.uuid1()
        self.source_folder = source_folder
        self.build_folder = build_folder

        os.makedirs(build_folder, exist_ok=True)

    def copy_static_file(self):
        static_src = os.path.join(self.source_folder, 'static')
        static_dst = os.path.join(self.build_folder, 'static')

        os.makedirs(static_dst, exist_ok=True)

        for fn in os.listdir(static_src):
            print(fn)
            shutil.copy(os.path.join(static_src, fn), os.path.join(static_dst, fn))

        shutil.copy(os.path.join(self.source_folder, 'robots.txt'), os.path.join(self.build_folder, 'robots.txt'))

    def generate_html(self):
        env = Environment(
            loader=FileSystemLoader(self.source_folder),
            autoescape=select_autoescape(['html', 'xml'])
        )

        for fn in os.listdir(self.source_folder):
            if fn.endswith('.html.in'):
                print(fn)
                template = env.get_template(fn)
                with open(os.path.join(self.build_folder, fn[:-3]), 'w') as f:
                    f.write(template.render(build_number=self.build_number))

    def generate_css(self):
        css_source_folder = os.path.join(self.source_folder, 'css')

        with open(os.path.join(self.build_folder, 'main-{}.css'.format(self.build_number)), 'wt') as f_out:
            for fn in os.listdir(css_source_folder):
                fp = os.path.join(css_source_folder, fn)
                with open(fp) as f_in:
                    f_out.write(f_in.read())
                    f_out.write('\n')

    def generate_js(self):
        js_source_folder = os.path.join(self.source_folder, 'js')

        sources = [
            'util.js',
            'socket.js',
            'player.js',
            'player_html5.js',
            'player_youtube.js',
            'player_vimeo.js',
        ]

        with open(os.path.join(self.build_folder, 'main-{}.js'.format(self.build_number)), 'wt') as f_out:
            for source in sources:
                fp = os.path.join(js_source_folder, source)
                with open(fp) as f_in:
                    f_out.write(f_in.read())
                    f_out.write('\n')


def main():
    gen = Generator('./src')
    gen.copy_static_file()
    gen.generate_html()
    gen.generate_css()
    gen.generate_js()


if __name__ == '__main__':
    main()